const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // The renter requesting the item
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Renter reference is required."],
      index: true,
    },

    // The listing being booked
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing reference is required."],
      index: true,
    },

    // The owner of the listing (denormalized for direct queries & authorization)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner reference is required."],
      index: true,
    },

    // Rental period
    startDate: {
      type: Date,
      required: [true, "Rental start date is required."],
    },
    endDate: {
      type: Date,
      required: [true, "Rental end date is required."],
    },
    days: {
      type: Number,
      required: [true, "Rental duration in days is required."],
      min: [1, "Rental duration must be at least 1 day."],
    },

    // Pricing captured at time of booking (never trusted from client)
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required."],
      min: [0, "Daily rate cannot be negative."],
    },
    basePrice: {
      type: Number,
      required: [true, "Base rental price is required."],
      min: [0, "Base price cannot be negative."],
    },
    deposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative."],
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: [0, "Service fee cannot be negative."],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required."],
      min: [0, "Total price cannot be negative."],
    },

    // Lifecycle status
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "rejected", "cancelled", "completed"],
        message: "{VALUE} is not a supported booking status.",
      },
      default: "pending",
      index: true,
    },

    // Optional communication
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters."],
      trim: true,
    },
    rejectionReason: {
      type: String,
      maxlength: [300, "Rejection reason cannot exceed 300 characters."],
      trim: true,
    },
    cancellationReason: {
      type: String,
      maxlength: [300, "Cancellation reason cannot exceed 300 characters."],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast conflict/overlap queries
bookingSchema.index({
  listing: 1,
  status: 1,
  startDate: 1,
  endDate: 1,
});

module.exports = mongoose.model("Booking", bookingSchema);
