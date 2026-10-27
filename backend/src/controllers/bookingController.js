const mongoose = require("mongoose");
const Booking = require("../models/BookingModel");
const Listing = require("../models/ListingModel");
const { createNotification } = require("./notificationController");

/**
 * Normalizes a date string/object to midnight (00:00:00.000)
 */
function normalizeDateToMidnight(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * POST /api/bookings
 * Renter submits a new booking request for an available rental listing.
 */
exports.createBooking = async (req, res) => {
  try {
    const renterId = req.user._id;
    const { listingId, startDate, endDate, notes } = req.body;

    // 1. Basic validation
    if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "A valid listing ID is required." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Both start and end dates are required." });
    }

    const start = normalizeDateToMidnight(startDate);
    const end = normalizeDateToMidnight(endDate);
    const today = normalizeDateToMidnight(new Date());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format provided." });
    }

    if (start < today) {
      return res.status(400).json({ message: "Rental start date cannot be in the past." });
    }

    if (end <= start) {
      return res.status(400).json({ message: "Rental end date must be after the start date." });
    }

    // 2. Fetch Listing and verify availability
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (listing.availability === "inactive") {
      return res.status(400).json({ message: "This listing is currently inactive and cannot be rented." });
    }

    // 3. Prevent owner from booking their own item
    if (listing.owner.toString() === renterId.toString()) {
      return res.status(400).json({ message: "You cannot book your own listing." });
    }

    // 4. Overlap Prevention: Check conflicting pending or confirmed bookings
    // Overlap condition: existing.startDate < requested.endDate && existing.endDate > requested.startDate
    const conflictingBooking = await Booking.findOne({
      listing: listingId,
      status: { $in: ["pending", "confirmed"] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        message:
          "The selected dates conflict with an existing booking for this item. Please choose different dates.",
        conflictingBooking: {
          startDate: conflictingBooking.startDate,
          endDate: conflictingBooking.endDate,
          status: conflictingBooking.status,
        },
      });
    }

    // 4b. Check owner manual blackout / maintenance dates
    const conflictingBlackout = (listing.blockedDates || []).find((b) => {
      const bStart = normalizeDateToMidnight(b.startDate);
      const bEnd = normalizeDateToMidnight(b.endDate);
      return bStart < end && bEnd > start;
    });

    if (conflictingBlackout) {
      return res.status(409).json({
        message: `This item is unavailable during the requested dates (${conflictingBlackout.reason || "Scheduled Maintenance"}).`,
        conflictingBlackout: {
          startDate: conflictingBlackout.startDate,
          endDate: conflictingBlackout.endDate,
          reason: conflictingBlackout.reason,
        },
      });
    }

    // 5. Server-side price calculation (incorporating weekend rates & duration discounts)
    const { calculateRentalPricing } = require("../utils/pricingCalculator");
    let pricing;
    try {
      pricing = calculateRentalPricing(listing, start, end);
    } catch (pricingErr) {
      return res.status(pricingErr.status || 400).json({ message: pricingErr.message });
    }

    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 6. Create booking record
    const booking = new Booking({
      renter: renterId,
      listing: listing._id,
      owner: listing.owner,
      startDate: start,
      endDate: end,
      days: pricing.days,
      dailyRate: pricing.dailyRate,
      weekdayDays: pricing.weekdayDays,
      weekendDays: pricing.weekendDays,
      discountAmount: pricing.discountAmount,
      appliedDiscountType: pricing.appliedDiscountType,
      basePrice: pricing.basePrice,
      deposit: pricing.deposit,
      serviceFee: pricing.serviceFee,
      totalPrice: pricing.totalPrice,
      status: "pending",
      pickupOtp,
      notes: notes ? String(notes).trim().slice(0, 500) : "",
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("listing", "title images location rentalPricePerDay category")
      .populate("owner", "name email");

    // Send in-app notification to host
    createNotification({
      recipient: listing.owner,
      sender: renterId,
      type: "booking_request",
      title: "New Rental Request Received",
      message: `${req.user?.name || "A renter"} submitted a booking request for "${listing.title}" (${pricing.days} ${pricing.days === 1 ? "day" : "days"}).`,
      booking: booking._id,
      listing: listing._id,
      link: "/owner/dashboard",
    }).catch(() => {});

    return res.status(201).json({
      message: "Booking request submitted successfully! Awaiting owner confirmation.",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({
      message: "An error occurred while creating your booking request.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/my-rentals
 * Renter views all rentals they have requested or booked.
 */
exports.getMyRentals = async (req, res) => {
  try {
    const renterId = req.user._id;
    const filter = { renter: renterId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate("listing", "title images location rentalPricePerDay category availability")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("getMyRentals error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching your rental bookings.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/owner-requests
 * Owner views all incoming booking requests for listings they own.
 */
exports.getOwnerRequests = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const filter = { owner: ownerId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate("listing", "title images location rentalPricePerDay category availability")
      .populate("renter", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("getOwnerRequests error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching owner booking requests.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/:id
 * Retrieve a single booking details (accessible by renter or owner).
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const booking = await Booking.findById(id)
      .populate("listing", "title images location rentalPricePerDay deposit category owner")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Authorization: User must be either the renter or the owner
    const isRenter = booking.renter._id.toString() === userId;
    const isOwner = booking.owner._id.toString() === userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: "You are not authorized to view this booking." });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching booking details.",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/bookings/:id/status
 * Updates status of a booking enforcing strict role permissions and state machine.
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: nextStatus, reason } = req.body;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const validStatuses = ["confirmed", "in_progress", "rejected", "cancelled", "completed", "disputed"];
    if (!nextStatus || !validStatuses.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid status. Permitted statuses are: ${validStatuses.join(", ")}`,
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const isOwner = booking.owner.toString() === userId;
    const isRenter = booking.renter.toString() === userId;

    if (!isOwner && !isRenter) {
      return res.status(403).json({ message: "You are not authorized to update this booking." });
    }

    const currentStatus = booking.status;

    // Terminal statuses cannot be modified
    if (["rejected", "cancelled", "completed"].includes(currentStatus)) {
      return res.status(400).json({
        message: `Cannot update booking that is already ${currentStatus}.`,
      });
    }

    // Role-based State Machine validation
    if (isOwner) {
      // Owner can:
      // pending -> confirmed | rejected
      // confirmed -> in_progress | completed
      // in_progress -> completed | disputed
      if (currentStatus === "pending") {
        if (!["confirmed", "rejected"].includes(nextStatus)) {
          return res.status(400).json({
            message: `As owner, you can only accept (confirm) or reject a pending request.`,
          });
        }
      } else if (currentStatus === "confirmed" || currentStatus === "in_progress") {
        if (!["in_progress", "completed", "disputed"].includes(nextStatus)) {
          return res.status(400).json({
            message: `As owner, permitted transitions from ${currentStatus} are: in_progress, completed, or disputed.`,
          });
        }
        if (nextStatus === "completed" && booking.paymentStatus !== "escrow_held") {
          return res.status(400).json({
            message: "Cannot mark booking as completed: renter has not secured payment into escrow yet.",
          });
        }
      }

      // If owner is confirming, double-check for concurrent confirmed overlap!
      if (nextStatus === "confirmed") {
        const overlapConfirmed = await Booking.findOne({
          _id: { $ne: booking._id },
          listing: booking.listing,
          status: "confirmed",
          startDate: { $lt: booking.endDate },
          endDate: { $gt: booking.startDate },
        });

        if (overlapConfirmed) {
          return res.status(409).json({
            message:
              "Cannot confirm booking: another booking is already confirmed for overlapping dates.",
          });
        }
      }

      if (nextStatus === "rejected" && reason) {
        booking.rejectionReason = String(reason).trim().slice(0, 300);
      }
    } else if (isRenter) {
      // Renter can only cancel their booking (from pending or confirmed)
      if (nextStatus !== "cancelled") {
        return res.status(400).json({
          message: `As renter, you can only cancel your booking request.`,
        });
      }

      if (reason) {
        booking.cancellationReason = String(reason).trim().slice(0, 300);
      }
    }

    booking.status = nextStatus;
    await booking.save();

    // Automate Platform Escrow Lifecycle Transitions
    try {
      const { refundEscrowPayment, releaseHostPayoutAndRefundDeposit } = require("./paymentController");
      if (["cancelled", "rejected"].includes(nextStatus)) {
        await refundEscrowPayment(booking._id, reason || `Booking marked as ${nextStatus}`);
      } else if (nextStatus === "completed") {
        await releaseHostPayoutAndRefundDeposit(booking._id);
      }
    } catch (escrowErr) {
      console.error("Escrow automated transition error:", escrowErr);
    }

    const updated = await Booking.findById(booking._id)
      .populate("listing", "title images location rentalPricePerDay category")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone");

    // Dispatch in-app notifications
    if (nextStatus === "confirmed") {
      createNotification({
        recipient: booking.renter,
        sender: booking.owner,
        type: "booking_confirmed",
        title: "Rental Request Approved! 🎉",
        message: `Your booking for "${updated.listing?.title}" was accepted by ${updated.owner?.name || "the host"}. You can now pay & secure escrow.`,
        booking: booking._id,
        listing: updated.listing?._id,
        link: "/bookings",
      }).catch(() => {});
    } else if (nextStatus === "rejected") {
      createNotification({
        recipient: booking.renter,
        sender: booking.owner,
        type: "booking_rejected",
        title: "Rental Request Declined",
        message: `Your booking for "${updated.listing?.title}" was declined by the host${reason ? `: "${reason}"` : "."}`,
        booking: booking._id,
        listing: updated.listing?._id,
        link: "/bookings",
      }).catch(() => {});
    } else if (nextStatus === "cancelled") {
      const recipient = isRenter ? booking.owner : booking.renter;
      const sender = isRenter ? booking.renter : booking.owner;
      const actorName = isRenter ? updated.renter?.name : updated.owner?.name;
      createNotification({
        recipient,
        sender,
        type: "booking_cancelled",
        title: "Rental Booking Cancelled",
        message: `${actorName || "The other party"} cancelled the booking for "${updated.listing?.title}"${reason ? `: "${reason}"` : "."}`,
        booking: booking._id,
        listing: updated.listing?._id,
        link: isRenter ? "/owner/dashboard" : "/bookings",
      }).catch(() => {});
    } else if (nextStatus === "completed") {
      createNotification({
        recipient: booking.renter,
        sender: booking.owner,
        type: "rental_completed",
        title: "Rental Completed & Deposit Returned! ✨",
        message: `Your rental of "${updated.listing?.title}" has completed. Your security deposit has been returned!`,
        booking: booking._id,
        listing: updated.listing?._id,
        link: "/bookings",
      }).catch(() => {});
      createNotification({
        recipient: booking.owner,
        sender: booking.renter,
        type: "payout_released",
        title: "Rental Payout Disbursed 💰",
        message: `Rental payout for "${updated.listing?.title}" has been released to your host balance.`,
        booking: booking._id,
        listing: updated.listing?._id,
        link: "/owner/dashboard",
      }).catch(() => {});
    }

    return res.status(200).json({
      message: `Booking successfully marked as ${nextStatus}.`,
      booking: updated,
    });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    return res.status(500).json({
      message: "An error occurred while updating booking status.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/listing/:listingId/booked-dates
 * Public/Renter helper: Returns all booked and blackout date intervals for a listing
 * so calendar UI can visually disable unavailable dates.
 */
exports.getBookedDatesForListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const today = normalizeDateToMidnight(new Date());

    // 1. Fetch active bookings (pending & confirmed)
    const activeBookings = await Booking.find({
      listing: listingId,
      status: { $in: ["pending", "confirmed"] },
      endDate: { $gte: today },
    }).select("startDate endDate status");

    const bookedRanges = activeBookings.map((b) => ({
      _id: b._id,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      type: "booking",
    }));

    // 2. Fetch owner-defined blackout / maintenance dates
    const listing = await Listing.findById(listingId).select("blockedDates");
    if (listing && Array.isArray(listing.blockedDates)) {
      listing.blockedDates.forEach((b) => {
        if (new Date(b.endDate) >= today) {
          bookedRanges.push({
            _id: b._id,
            startDate: b.startDate,
            endDate: b.endDate,
            status: "blocked",
            reason: b.reason || "Maintenance / Personal",
            type: "blackout",
          });
        }
      });
    }

    return res.status(200).json({
      listingId,
      bookedRanges,
    });
  } catch (error) {
    console.error("getBookedDatesForListing error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching booked dates for this listing.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/listing/:listingId/owner-calendar
 * Protected (Owner only): Returns full booking history and blackout schedule
 * for a specific listing to render the host's interactive availability calendar.
 */
exports.getOwnerListingCalendar = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { listingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const listing = await Listing.findById(listingId).populate("category", "name icon");
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (listing.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Access denied: you do not own this listing." });
    }

    const bookings = await Booking.find({ listing: listingId })
      .populate("renter", "name email phone")
      .sort({ startDate: 1 });

    return res.status(200).json({
      listing: {
        _id: listing._id,
        title: listing.title,
        rentalPricePerDay: listing.rentalPricePerDay,
        deposit: listing.deposit,
        location: listing.location,
        images: listing.images,
        availability: listing.availability,
        category: listing.category,
      },
      bookings,
      blockedDates: listing.blockedDates || [],
    });
  } catch (error) {
    console.error("getOwnerListingCalendar error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching listing calendar.",
      error: error.message,
    });
  }
};

/**
 * POST /api/bookings/listing/:listingId/blocked-dates
 * Protected (Owner only): Adds an owner maintenance or personal use blackout date range.
 */
exports.addBlockedDates = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { listingId } = req.params;
    const { startDate, endDate, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const start = normalizeDateToMidnight(startDate);
    const end = normalizeDateToMidnight(endDate);
    const today = normalizeDateToMidnight(new Date());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format provided." });
    }

    if (start < today) {
      return res.status(400).json({ message: "Blackout start date cannot be in the past." });
    }

    if (end <= start) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (listing.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Access denied: you do not own this listing." });
    }

    // Check if conflicting with any existing confirmed booking
    const conflictBooking = await Booking.findOne({
      listing: listingId,
      status: "confirmed",
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    if (conflictBooking) {
      return res.status(409).json({
        message: "Cannot block these dates because an active confirmed booking already exists in this period.",
        conflictBooking: {
          startDate: conflictBooking.startDate,
          endDate: conflictBooking.endDate,
        },
      });
    }

    if (!listing.blockedDates) {
      listing.blockedDates = [];
    }

    listing.blockedDates.push({
      startDate: start,
      endDate: end,
      reason: reason?.trim() || "Maintenance / Personal Use",
    });

    await listing.save();

    return res.status(201).json({
      message: "Blackout dates added successfully.",
      blockedDates: listing.blockedDates,
    });
  } catch (error) {
    console.error("addBlockedDates error:", error);
    return res.status(500).json({
      message: "An error occurred while adding blackout dates.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/bookings/listing/:listingId/blocked-dates/:dateId
 * Protected (Owner only): Removes a custom owner blackout date range.
 */
exports.removeBlockedDate = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { listingId, dateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (listing.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Access denied: you do not own this listing." });
    }

    listing.blockedDates = (listing.blockedDates || []).filter(
      (b) => b._id.toString() !== dateId.toString()
    );

    await listing.save();

    return res.status(200).json({
      message: "Blackout date removed successfully.",
      blockedDates: listing.blockedDates,
    });
  } catch (error) {
    console.error("removeBlockedDate error:", error);
    return res.status(500).json({
      message: "An error occurred while removing blackout date.",
      error: error.message,
    });
  }
};

/**
 * POST /api/bookings/:id/verify-pickup
 * Host enters the 6-digit Pickup OTP provided by renter, conducts condition inspection, and starts rental.
 */
exports.verifyPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const rawOtp = req.body.otp || req.body.pickupOtp;
    const otp = rawOtp ? String(rawOtp).trim() : "";
    const { photos = [], notes = "" } = req.body;
    const hostId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const booking = await Booking.findById(id).populate("listing", "title");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.owner.toString() !== hostId) {
      return res.status(403).json({ message: "Only the host can verify physical item pickup." });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: `Cannot verify pickup for a booking with status '${booking.status}'.` });
    }

    if (booking.paymentStatus !== "escrow_held") {
      return res.status(400).json({ message: "Cannot verify pickup: rental payment must be secured in escrow first." });
    }

    if (!otp || String(otp).trim() !== String(booking.pickupOtp).trim()) {
      return res.status(400).json({ message: "Invalid Pickup OTP code. Please ask the renter for their 6-digit code." });
    }

    const returnOtp = Math.floor(100000 + Math.random() * 900000).toString();

    booking.status = "in_progress";
    booking.returnOtp = returnOtp;
    booking.pickupInspection = {
      verifiedAt: new Date(),
      photos: Array.isArray(photos) ? photos : [],
      notes: notes ? notes.trim() : "",
      verifiedBy: req.user._id,
    };
    await booking.save();

    // Notify renter that rental is in progress
    createNotification({
      recipient: booking.renter,
      sender: booking.owner,
      type: "general",
      title: "Item Handover Verified! 🚀",
      message: `Pickup confirmed for "${booking.listing?.title}". Your rental is now in progress! Return PIN: ${returnOtp}.`,
      booking: booking._id,
      listing: booking.listing._id || booking.listing,
      link: "/bookings",
    }).catch(() => {});

    const updated = await Booking.findById(booking._id)
      .populate("listing", "title images location")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Item handover verified successfully! Rental is now in progress.",
      booking: updated,
    });
  } catch (error) {
    console.error("verifyPickup error:", error);
    return res.status(500).json({ message: "Failed to verify item pickup.", error: error.message });
  }
};

/**
 * POST /api/bookings/:id/generate-return-otp
 * Generates or retrieves the 6-digit Return OTP for physical return verification
 */
exports.generateReturnOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.renter.toString() !== userId && booking.owner.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    if (!booking.returnOtp) {
      booking.returnOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      returnOtp: booking.returnOtp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve return OTP.", error: error.message });
  }
};

/**
 * POST /api/bookings/:id/verify-return
 * Host inputs the 6-digit Return OTP provided by renter, conducts return condition inspection,
 * and either completes rental or files damage claim.
 */
exports.verifyReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const rawOtp = req.body.otp || req.body.returnOtp;
    const otp = rawOtp ? String(rawOtp).trim() : "";
    const { photos = [], notes = "", conditionStatus = "good" } = req.body;
    const hostId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const booking = await Booking.findById(id).populate("listing", "title");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.owner.toString() !== hostId) {
      return res.status(403).json({ message: "Only the host can verify return." });
    }

    if (!["in_progress", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot verify return for a booking with status '${booking.status}'.` });
    }

    if (!otp || String(otp).trim() !== String(booking.returnOtp).trim()) {
      return res.status(400).json({ message: "Invalid Return OTP code. Please ask the renter for their 6-digit return PIN." });
    }

    booking.returnInspection = {
      verifiedAt: new Date(),
      photos: Array.isArray(photos) ? photos : [],
      notes: notes ? notes.trim() : "",
      conditionStatus: conditionStatus || "good",
      verifiedBy: req.user._id,
    };

    if (conditionStatus === "good") {
      // Completed cleanly: release payout & refund full deposit
      booking.status = "completed";
      await booking.save();

      const { releaseHostPayoutAndRefundDeposit } = require("./paymentController");
      await releaseHostPayoutAndRefundDeposit(booking._id).catch(() => {});

      createNotification({
        recipient: booking.renter,
        sender: booking.owner,
        type: "rental_completed",
        title: "Rental Completed & Deposit Returned! ✨",
        message: `Your return of "${booking.listing?.title}" was verified in good condition. Security deposit refunded!`,
        booking: booking._id,
        listing: booking.listing._id || booking.listing,
        link: "/bookings",
      }).catch(() => {});
    } else {
      // Damaged or missing items -> shift to disputed
      booking.status = "disputed";
      booking.depositStatus = "disputed";
      await booking.save();

      createNotification({
        recipient: booking.renter,
        sender: booking.owner,
        type: "general",
        title: "Return Marked with Damage / Issues ⚠️",
        message: `Host reported condition issues upon return of "${booking.listing?.title}". Deposit has been placed on hold.`,
        booking: booking._id,
        listing: booking.listing._id || booking.listing,
        link: "/bookings",
      }).catch(() => {});
    }

    const updated = await Booking.findById(booking._id)
      .populate("listing", "title images location")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone");

    return res.status(200).json({
      success: true,
      message: conditionStatus === "good" ? "Return verified! Rental completed and deposit refunded." : "Return recorded with damage. Deposit placed on hold for claim submission.",
      booking: updated,
    });
  } catch (error) {
    console.error("verifyReturn error:", error);
    return res.status(500).json({ message: "Failed to verify return.", error: error.message });
  }
};


