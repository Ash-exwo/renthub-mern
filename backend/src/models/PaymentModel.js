const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Associated booking
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required."],
      index: true,
    },

    // Associated listing
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    // Renter who paid
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Owner receiving payout
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Total transaction amount
    totalAmount: {
      type: Number,
      required: [true, "Total payment amount is required."],
      min: [0, "Payment amount cannot be negative."],
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    // Financial breakdown held in escrow
    breakdown: {
      baseRent: {
        type: Number,
        required: true,
      },
      deposit: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
    },

    // Payment method used
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "test_simulation"],
      default: "test_simulation",
    },

    // Unique transaction reference
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Gateway order ID (for external integrations)
    gatewayOrderId: {
      type: String,
      default: null,
    },

    // Overall transaction status
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    // Platform escrow custody status
    escrowStatus: {
      type: String,
      enum: [
        "unfunded",
        "held_in_escrow",
        "released_to_host",
        "refunded_to_renter",
        "partially_refunded",
      ],
      default: "unfunded",
      index: true,
    },

    // Refundable security deposit status
    depositStatus: {
      type: String,
      enum: ["unfunded", "held", "refunded", "retained_for_damage"],
      default: "unfunded",
    },

    // Payment method metadata (masked for security)
    paymentDetails: {
      cardLast4: { type: String, default: null },
      cardBrand: { type: String, default: null },
      upiId: { type: String, default: null },
      bankName: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },

    // Refund tracking
    refundDetails: {
      refundId: { type: String, default: null },
      refundAmount: { type: Number, default: 0 },
      refundedAt: { type: Date, default: null },
      reason: { type: String, default: null },
    },

    // Payout to host tracking
    payoutDetails: {
      payoutId: { type: String, default: null },
      hostAmount: { type: Number, default: 0 },
      releasedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
