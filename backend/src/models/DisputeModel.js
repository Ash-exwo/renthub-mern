const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required."],
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing reference is required."],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host reference is required."],
      index: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Renter reference is required."],
      index: true,
    },
    claimAmount: {
      type: Number,
      required: [true, "Claim amount is required."],
      min: [1, "Claim amount must be at least ₹1."],
    },
    hostReason: {
      type: String,
      required: [true, "Damage claim reason is required."],
      trim: true,
      minlength: [1, "Damage reason cannot be empty."],
      maxlength: [50, "Damage explanation cannot exceed 50 characters."],
    },
    hostPhotos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "pending_renter_response",
        "pending_renter",
        "accepted_by_renter",
        "escalated_to_admin",
        "resolved",
      ],
      default: "pending_renter_response",
      index: true,
    },
    renterResponse: {
      decision: {
        type: String,
        enum: ["accept", "contest", null],
        default: null,
      },
      counterReason: {
        type: String,
        default: "",
        maxlength: [2000, "Counter reason cannot exceed 2000 characters."],
        trim: true,
      },
      counterPhotos: {
        type: [String],
        default: [],
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
    resolution: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      ruling: {
        type: String,
        enum: ["award_host_full", "award_host_partial", "refund_renter_full", null],
        default: null,
      },
      hostAwardAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      renterRefundAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      adminNotes: {
        type: String,
        default: "",
        maxlength: [1000, "Admin arbitration notes cannot exceed 1000 characters."],
        trim: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Virtual aliases for frontend compatibility
disputeSchema.virtual("reason").get(function () {
  return this.hostReason;
});
disputeSchema.virtual("damagePhotos").get(function () {
  return this.hostPhotos;
});
disputeSchema.virtual("renterNotes").get(function () {
  return this.renterResponse?.counterReason || "";
});
disputeSchema.virtual("adminRuling").get(function () {
  return this.resolution?.ruling || null;
});
disputeSchema.virtual("awardedToHost").get(function () {
  return this.resolution?.hostAwardAmount || 0;
});
disputeSchema.virtual("refundedToRenter").get(function () {
  return this.resolution?.renterRefundAmount || 0;
});
disputeSchema.virtual("adminNotes").get(function () {
  return this.resolution?.adminNotes || "";
});


module.exports = mongoose.model("Dispute", disputeSchema);
