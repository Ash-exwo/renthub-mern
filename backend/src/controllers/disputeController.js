const mongoose = require("mongoose");
const Dispute = require("../models/DisputeModel");
const Booking = require("../models/BookingModel");
const Payment = require("../models/PaymentModel");
const Notification = require("../models/NotificationModel");

/**
 * POST /api/disputes
 * Host files a security deposit damage claim for an in_progress, returned, or completed booking.
 */
exports.createDispute = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { bookingId, claimAmount } = req.body;
    const rawReason = req.body.hostReason || req.body.reason;
    const hostReason = rawReason ? String(rawReason).trim() : "";
    const hostPhotos = req.body.hostPhotos || req.body.damagePhotos || [];

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "A valid booking ID is required." });
    }

    const booking = await Booking.findById(bookingId).populate("listing", "title");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.owner.toString() !== hostId.toString()) {
      return res.status(403).json({ message: "Only the host can file a damage claim for this booking." });
    }

    if (!booking.deposit || booking.deposit <= 0) {
      return res.status(400).json({ message: "This booking has no security deposit to claim against." });
    }

    const amount = Number(claimAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Claim amount must be a positive number greater than ₹0." });
    }

    if (amount > booking.deposit) {
      return res.status(400).json({
        message: `Claim amount cannot exceed the security deposit of ₹${booking.deposit.toLocaleString("en-IN")}.`,
      });
    }

    if (!hostReason) {
      return res.status(400).json({
        message: "Please provide an explanation of the damage.",
      });
    }

    if (hostReason.length > 50) {
      return res.status(400).json({
        message: "Damage explanation cannot exceed 50 characters.",
      });
    }

    // Check if an active dispute already exists
    const existing = await Dispute.findOne({ booking: bookingId });
    if (existing && existing.status !== "resolved") {
      return res.status(400).json({
        message: "An active dispute already exists for this booking.",
        dispute: existing,
      });
    }

    const dispute = await Dispute.create({
      booking: booking._id,
      listing: booking.listing._id || booking.listing,
      host: hostId,
      renter: booking.renter,
      claimAmount: amount,
      hostReason: hostReason.trim(),
      hostPhotos: Array.isArray(hostPhotos) ? hostPhotos : [],
      status: "pending_renter_response",
    });

    // Update Booking status to disputed
    booking.status = "disputed";
    booking.depositStatus = "disputed";
    booking.dispute = dispute._id;
    await booking.save();

    // Update Payment depositStatus
    await Payment.findOneAndUpdate(
      { booking: booking._id },
      { depositStatus: "disputed" }
    );

    // Notify Renter of damage claim
    try {
      await Notification.create({
        recipient: booking.renter,
        sender: hostId,
        type: "general",
        title: "Damage Claim Filed Against Security Deposit ⚠️",
        message: `Host filed a claim of ₹${amount.toLocaleString("en-IN")} for "${booking.listing?.title || "your rental"}". You have 48 hours to accept or submit counter-evidence.`,
        booking: booking._id,
        listing: booking.listing._id || booking.listing,
        link: "/bookings",
      });
    } catch (e) {
      console.error("Warning: Failed to dispatch dispute notification to renter:", e.message);
    }

    const populated = await Dispute.findById(dispute._id)
      .populate("host", "name email phone")
      .populate("renter", "name email phone")
      .populate("listing", "title images location");

    return res.status(201).json({
      success: true,
      message: "Damage claim submitted successfully. The renter has been notified to respond.",
      dispute: populated,
    });
  } catch (error) {
    console.error("createDispute error:", error);
    return res.status(500).json({
      message: "An error occurred while filing the damage claim.",
      error: error.message,
    });
  }
};

/**
 * GET /api/disputes/booking/:bookingId
 * Fetch dispute details for a specific booking (accessible by Renter, Host, or Admin)
 */
exports.getDisputeByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?._id?.toString() || req.admin?._id?.toString();

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const dispute = await Dispute.findOne({ booking: bookingId })
      .populate("host", "name email phone")
      .populate("renter", "name email phone")
      .populate("listing", "title images location rentalPricePerDay deposit")
      .populate("resolution.resolvedBy", "username");

    if (!dispute) {
      return res.status(404).json({ message: "No dispute found for this booking." });
    }

    // Check authorization: caller must be host, renter, or admin
    const isHost = dispute.host._id.toString() === userId;
    const isRenter = dispute.renter._id.toString() === userId;
    const isAdmin = Boolean(req.admin);

    if (!isHost && !isRenter && !isAdmin) {
      return res.status(403).json({ message: "You are not authorized to view this dispute." });
    }

    const booking = await Booking.findById(bookingId).select("pickupInspection returnInspection deposit days startDate endDate");

    return res.status(200).json({
      success: true,
      dispute,
      inspections: {
        pickup: booking?.pickupInspection || null,
        return: booking?.returnInspection || null,
      },
    });
  } catch (error) {
    console.error("getDisputeByBooking error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching dispute details.",
      error: error.message,
    });
  }
};

/**
 * POST /api/disputes/:id/respond
 * Renter accepts or contests the damage claim
 */
exports.renterRespondToDispute = async (req, res) => {
  try {
    const renterId = req.user._id;
    const { id } = req.params;
    const { decision, counterReason, counterPhotos = [] } = req.body;

    if (!["accept", "contest"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be either 'accept' or 'contest'." });
    }

    const dispute = await Dispute.findById(id).populate("booking").populate("listing", "title");
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found." });
    }

    if (dispute.renter.toString() !== renterId.toString()) {
      return res.status(403).json({ message: "Only the renter can respond to this dispute." });
    }

    if (!["pending_renter_response", "pending_renter"].includes(dispute.status)) {
      return res.status(400).json({
        message: `Cannot respond to dispute that is already in '${dispute.status}' status.`,
      });
    }

    const booking = await Booking.findById(dispute.booking._id || dispute.booking);
    const payment = await Payment.findOne({ booking: booking._id, status: "succeeded" });

    if (decision === "accept") {
      // Renter accepted the claim!
      dispute.status = "accepted_by_renter";
      dispute.renterResponse = {
        decision: "accept",
        counterReason: counterReason ? counterReason.trim() : "Accepted by renter.",
        counterPhotos: [],
        respondedAt: new Date(),
      };
      dispute.resolution = {
        resolvedBy: null,
        resolvedAt: new Date(),
        ruling: "award_host_partial",
        hostAwardAmount: dispute.claimAmount,
        renterRefundAmount: Math.max(0, booking.deposit - dispute.claimAmount),
        adminNotes: "Settled automatically upon mutual renter agreement.",
      };
      await dispute.save();

      // Execute Escrow Settlement
      const refundToRenter = Math.max(0, booking.deposit - dispute.claimAmount);
      if (payment) {
        payment.depositStatus = refundToRenter > 0 ? "partially_refunded" : "retained_for_damage";
        payment.escrowStatus = "released_to_host";
        payment.payoutDetails = {
          payoutId: `PAYOUT_DISP_${Date.now()}`,
          hostAmount: (payment.breakdown.baseRent || 0) + dispute.claimAmount,
          releasedAt: new Date(),
        };
        await payment.save();
      }

      booking.status = "completed";
      booking.depositStatus = refundToRenter > 0 ? "partially_refunded" : "retained_for_damage";
      booking.paymentStatus = "payout_released";
      await booking.save();

      // Notify Host of acceptance and payout
      try {
        await Notification.create({
          recipient: dispute.host,
          sender: renterId,
          type: "general",
          title: "Damage Claim Accepted by Renter ✅",
          message: `The renter accepted your claim of ₹${dispute.claimAmount.toLocaleString("en-IN")}. Payout has been released to your balance.`,
          booking: booking._id,
          listing: dispute.listing?._id,
        });
      } catch (e) {
        console.error("Warning: Notification failed:", e.message);
      }

      return res.status(200).json({
        success: true,
        message: "You accepted the damage claim. The deposit balance has been refunded.",
        dispute,
      });
    } else {
      // Renter contests with counter-evidence -> Escalate to Admin Tribunal
      if (!counterReason || counterReason.trim().length < 10) {
        return res.status(400).json({
          message: "Please provide an explanation of why you are contesting this claim (at least 10 characters).",
        });
      }

      dispute.status = "escalated_to_admin";
      dispute.renterResponse = {
        decision: "contest",
        counterReason: counterReason.trim(),
        counterPhotos: Array.isArray(counterPhotos) ? counterPhotos : [],
        respondedAt: new Date(),
      };
      await dispute.save();

      // Notify Host
      try {
        await Notification.create({
          recipient: dispute.host,
          sender: renterId,
          type: "general",
          title: "Damage Claim Contested ⚖️",
          message: `The renter has contested your claim for "${dispute.listing?.title}". The case has been escalated to RentHub Trust & Safety for arbitration.`,
          booking: booking._id,
          listing: dispute.listing?._id,
        });
      } catch (e) {
        console.error("Warning: Notification failed:", e.message);
      }

      return res.status(200).json({
        success: true,
        message: "Your counter-evidence was submitted. The dispute is now under official Admin Arbitration.",
        dispute,
      });
    }
  } catch (error) {
    console.error("renterRespondToDispute error:", error);
    return res.status(500).json({
      message: "An error occurred while submitting your dispute response.",
      error: error.message,
    });
  }
};

/**
 * GET /api/disputes/admin
 * Admin lists all damage disputes with filtering and counters
 */
exports.getAdminDisputes = async (req, res) => {
  try {
    const { status, search } = req.query;

    let filter = {};
    if (status && status !== "all") {
      if (status === "pending_renter" || status === "pending_renter_response") {
        filter.status = { $in: ["pending_renter_response", "pending_renter"] };
      } else {
        filter.status = status;
      }
    }

    const disputes = await Dispute.find(filter)
      .populate("host", "name email phone avatar")
      .populate("renter", "name email phone avatar")
      .populate("listing", "title images location rentalPricePerDay deposit")
      .populate("booking", "startDate endDate days deposit totalPrice pickupInspection returnInspection")
      .populate("resolution.resolvedBy", "username")
      .sort({ createdAt: -1 });

    let filtered = disputes;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = disputes.filter((d) => {
        const itemTitle = d.listing?.title || "";
        const hostName = d.host?.name || "";
        const renterName = d.renter?.name || "";
        const reason = d.hostReason || "";
        return (
          itemTitle.toLowerCase().includes(q) ||
          hostName.toLowerCase().includes(q) ||
          renterName.toLowerCase().includes(q) ||
          reason.toLowerCase().includes(q)
        );
      });
    }

    const [total, pendingResponse, escalated, resolved] = await Promise.all([
      Dispute.countDocuments({}),
      Dispute.countDocuments({ status: { $in: ["pending_renter_response", "pending_renter"] } }),
      Dispute.countDocuments({ status: "escalated_to_admin" }),
      Dispute.countDocuments({ status: "resolved" }),
    ]);

    return res.status(200).json({
      success: true,
      disputes: filtered,
      counts: {
        total,
        pendingResponse,
        escalated,
        resolved,
      },
    });
  } catch (error) {
    console.error("getAdminDisputes error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching disputes for admin.",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/disputes/admin/:id/resolve
 * Admin issues binding arbitration ruling for security deposit dispute
 */
exports.resolveDisputeByAdmin = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { id } = req.params;
    const { ruling, hostAwardAmount = 0, renterRefundAmount = 0, adminNotes = "" } = req.body;

    const validRulings = ["award_host_full", "award_host_partial", "refund_renter_full"];
    if (!validRulings.includes(ruling)) {
      return res.status(400).json({
        message: `Invalid ruling. Allowed rulings: ${validRulings.join(", ")}`,
      });
    }

    const dispute = await Dispute.findById(id).populate("booking").populate("listing", "title");
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found." });
    }

    if (dispute.status === "resolved") {
      return res.status(400).json({ message: "This dispute has already been resolved and closed." });
    }

    const booking = await Booking.findById(dispute.booking._id || dispute.booking);
    const depositTotal = Number(booking.deposit || 0);

    let finalHostAward = 0;
    let finalRenterRefund = 0;

    if (ruling === "award_host_full") {
      finalHostAward = dispute.claimAmount;
      finalRenterRefund = Math.max(0, depositTotal - dispute.claimAmount);
    } else if (ruling === "refund_renter_full") {
      finalHostAward = 0;
      finalRenterRefund = depositTotal;
    } else if (ruling === "award_host_partial") {
      finalHostAward = Math.min(depositTotal, Math.max(0, Number(hostAwardAmount)));
      finalRenterRefund = Math.max(0, depositTotal - finalHostAward);
    }

    dispute.status = "resolved";
    dispute.resolution = {
      resolvedBy: adminId,
      resolvedAt: new Date(),
      ruling,
      hostAwardAmount: finalHostAward,
      renterRefundAmount: finalRenterRefund,
      adminNotes: adminNotes ? adminNotes.trim() : `Arbitrated by Admin with ruling: ${ruling}`,
    };
    await dispute.save();

    // Financial Escrow Disbursement
    const payment = await Payment.findOne({ booking: booking._id, status: "succeeded" });
    if (payment) {
      payment.depositStatus = finalHostAward > 0 ? (finalRenterRefund > 0 ? "partially_refunded" : "retained_for_damage") : "refunded";
      payment.escrowStatus = "released_to_host";
      payment.payoutDetails = {
        payoutId: `PAYOUT_ARB_${Date.now()}`,
        hostAmount: (payment.breakdown?.baseRent || 0) + finalHostAward,
        releasedAt: new Date(),
      };
      await payment.save();
    }

    booking.status = "completed";
    booking.depositStatus = finalHostAward > 0 ? (finalRenterRefund > 0 ? "partially_refunded" : "retained_for_damage") : "refunded";
    booking.paymentStatus = "payout_released";
    await booking.save();

    // Send Verdict Notifications
    try {
      await Notification.create({
        recipient: dispute.host,
        type: "general",
        title: "Dispute Arbitration Verdict Issued ⚖️",
        message: `Admin resolved the dispute for "${dispute.listing?.title}". Awarded to host: ₹${finalHostAward.toLocaleString("en-IN")}.`,
        booking: booking._id,
        listing: dispute.listing?._id,
      });
      await Notification.create({
        recipient: dispute.renter,
        type: "general",
        title: "Dispute Arbitration Verdict Issued ⚖️",
        message: `Admin resolved the dispute for "${dispute.listing?.title}". Deposit refunded to you: ₹${finalRenterRefund.toLocaleString("en-IN")}.`,
        booking: booking._id,
        listing: dispute.listing?._id,
      });
    } catch (e) {
      console.error("Warning: Notification failed:", e.message);
    }

    const updated = await Dispute.findById(dispute._id)
      .populate("host", "name email phone")
      .populate("renter", "name email phone")
      .populate("listing", "title images location")
      .populate("resolution.resolvedBy", "username");

    return res.status(200).json({
      success: true,
      message: `Dispute successfully resolved with ruling '${ruling}'. Funds disbursed.`,
      dispute: updated,
    });
  } catch (error) {
    console.error("resolveDisputeByAdmin error:", error);
    return res.status(500).json({
      message: "An error occurred while arbitrating the dispute.",
      error: error.message,
    });
  }
};
