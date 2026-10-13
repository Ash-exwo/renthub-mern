const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer is required."],
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing is required."],
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required."],
      unique: true, // Strictly enforce 1 review per completed booking
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: [1, "Rating must be at least 1 star."],
      max: [5, "Rating cannot exceed 5 stars."],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required."],
      trim: true,
      minlength: [5, "Review comment must be at least 5 characters."],
      maxlength: [1000, "Review comment cannot exceed 1000 characters."],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch reviews for a listing sorted by newest
reviewSchema.index({ listing: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
