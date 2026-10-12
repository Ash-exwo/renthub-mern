const mongoose = require("mongoose");
const Booking = require("../models/BookingModel");
const Payment = require("../models/PaymentModel");
const Listing = require("../models/ListingModel");
const { createNotification } = require("./notificationController");

/**
 * POST /api/payments/checkout-session
 * Prepares the checkout session and validates pricing server-side before payment
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "A valid booking ID is required." });
    }

    const booking = await Booking.findById(bookingId)
      .populate("listing", "title images location rentalPricePerDay deposit category")
      .populate("owner", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.renter.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied: you are not the renter for this booking." });
    }

    if (["rejected", "cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot pay for a booking that is ${booking.status}.` });
    }

    if (booking.paymentStatus === "escrow_held" || booking.paymentStatus === "payout_released") {
      return res.status(400).json({ message: "This booking has already been paid for and is in escrow." });
    }

    return res.status(200).json({
      bookingId: booking._id,
      listing: {
        _id: booking.listing._id,
        title: booking.listing.title,
        image: booking.listing.images?.[0] || null,
        location: booking.listing.location,
        dailyRate: booking.dailyRate,
      },
      owner: {
        _id: booking.owner._id,
        name: booking.owner.name,
      },
      duration: {
        startDate: booking.startDate,
        endDate: booking.endDate,
        days: booking.days,
      },
      breakdown: {
        baseRent: booking.basePrice,
        securityDeposit: booking.deposit,
        serviceFee: booking.serviceFee,
        totalAmount: booking.totalPrice,
      },
      currency: "INR",
      testMode: true,
    });
  } catch (error) {
    console.error("createCheckoutSession error:", error);
    return res.status(500).json({
      message: "An error occurred while creating checkout session.",
      error: error.message,
    });
  }
};

/**
 * POST /api/payments/process
 * Processes test-mode payment authorization, establishes escrow, and holds security deposit
 */
exports.processPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookingId, paymentMethod = "card", paymentDetails = {} } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "A valid booking ID is required." });
    }

    const booking = await Booking.findById(bookingId).populate("listing", "title");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.renter.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied: you are not the renter for this booking." });
    }

    if (booking.paymentStatus === "escrow_held" || booking.paymentStatus === "payout_released") {
      return res.status(400).json({ message: "This booking is already paid and funded in escrow." });
    }

    if (["rejected", "cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot process payment for a ${booking.status} booking.` });
    }

    // Generate unique transaction reference
    const transactionId = `TXN_RH_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // Create payment ledger record
    const payment = new Payment({
      booking: booking._id,
      listing: booking.listing._id,
      renter: booking.renter,
      owner: booking.owner,
      totalAmount: booking.totalPrice,
      currency: "INR",
      breakdown: {
        baseRent: booking.basePrice,
        deposit: booking.deposit,
        serviceFee: booking.serviceFee,
      },
      paymentMethod,
      transactionId,
      status: "succeeded",
      escrowStatus: "held_in_escrow",
      depositStatus: booking.deposit > 0 ? "held" : "unfunded",
      paymentDetails: {
        cardLast4: paymentDetails.cardLast4 || (paymentMethod === "card" ? "4242" : null),
        cardBrand: paymentDetails.cardBrand || (paymentMethod === "card" ? "Visa" : null),
        upiId: paymentDetails.upiId || (paymentMethod === "upi" ? "renter@upi" : null),
        bankName: paymentDetails.bankName || (paymentMethod === "netbanking" ? "HDFC Bank" : null),
        paidAt: new Date(),
      },
    });

    await payment.save();

    // Atomically link to booking
    booking.paymentStatus = "escrow_held";
    booking.depositStatus = booking.deposit > 0 ? "held" : "unfunded";
    booking.payment = payment._id;
    await booking.save();

    // Send in-app notification to host
    createNotification({
      recipient: booking.owner,
      sender: booking.renter,
      type: "payment_escrow_funded",
      title: "Payment Secured in Escrow 🛡️",
      message: `Renter deposited ₹${booking.totalPrice.toLocaleString("en-IN")} into platform escrow for "${booking.listing?.title}".`,
      booking: booking._id,
      listing: booking.listing?._id,
      link: "/owner/dashboard",
    }).catch(() => {});

    // Confirmation notification to renter
    createNotification({
      recipient: booking.renter,
      type: "payment_escrow_funded",
      title: "Escrow Payment Confirmed",
      message: `Your payment of ₹${booking.totalPrice.toLocaleString("en-IN")} for "${booking.listing?.title}" is secured in platform escrow.`,
      booking: booking._id,
      listing: booking.listing?._id,
      link: "/bookings",
    }).catch(() => {});

    return res.status(200).json({
      message: "Payment successfully authorized and held in platform escrow.",
      transactionId,
      payment,
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        depositStatus: booking.depositStatus,
      },
    });
  } catch (error) {
    console.error("processPayment error:", error);
    return res.status(500).json({
      message: "An error occurred while processing payment.",
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/booking/:bookingId
 * Returns full itemized payment receipt, escrow status, and deposit ledger
 */
exports.getPaymentByBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const booking = await Booking.findById(bookingId)
      .populate("listing", "title images location rentalPricePerDay deposit category")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Verify caller is either renter or owner
    const isRenter = booking.renter._id.toString() === userId.toString();
    const isOwner = booking.owner._id.toString() === userId.toString();

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: "Access denied: you are not authorized to view this receipt." });
    }

    const payment = await Payment.findOne({ booking: bookingId });

    return res.status(200).json({
      hasPaid: Boolean(payment && payment.status === "succeeded"),
      booking,
      payment: payment || null,
      escrowStatus: payment ? payment.escrowStatus : "unfunded",
      depositStatus: payment ? payment.depositStatus : "unfunded",
    });
  } catch (error) {
    console.error("getPaymentByBooking error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching payment receipt.",
      error: error.message,
    });
  }
};

/**
 * Helper to refund escrow funds (called upon booking cancellation or rejection)
 */
exports.refundEscrowPayment = async (bookingId, reason = "Booking cancelled or rejected") => {
  const payment = await Payment.findOne({ booking: bookingId, status: "succeeded" });
  if (!payment) return null;

  if (payment.escrowStatus === "held_in_escrow") {
    const refundId = `REF_RH_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    payment.status = "refunded";
    payment.escrowStatus = "refunded_to_renter";
    payment.depositStatus = payment.depositStatus === "held" ? "refunded" : payment.depositStatus;
    payment.refundDetails = {
      refundId,
      refundAmount: payment.totalAmount,
      refundedAt: new Date(),
      reason,
    };
    await payment.save();

    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: "refunded",
      depositStatus: "refunded",
    });

    return payment;
  }
  return payment;
};

/**
 * Helper to release host payout and refund security deposit (called when booking is completed)
 */
exports.releaseHostPayoutAndRefundDeposit = async (bookingId) => {
  const payment = await Payment.findOne({ booking: bookingId, status: "succeeded" });
  if (!payment) return null;

  if (payment.escrowStatus === "held_in_escrow") {
    const payoutId = `PAYOUT_RH_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    payment.escrowStatus = "released_to_host";
    payment.depositStatus = payment.depositStatus === "held" ? "refunded" : payment.depositStatus;
    payment.payoutDetails = {
      payoutId,
      hostAmount: payment.breakdown.baseRent,
      releasedAt: new Date(),
    };
    await payment.save();

    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: "payout_released",
      depositStatus: "refunded",
    });

    return payment;
  }
  return payment;
};
