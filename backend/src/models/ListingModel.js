// Listing = something available for rent
const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Listing title is required."],
      trim: true,
      minlength: [5, "Title must contain at least 5 characters."],
      maxlength: [120, "Title cannot exceed 120 characters."],
    },

    description: {
      type: String,
      required: [true, "Listing description is required."],
      trim: true,
      minlength: [20, "Description must contain at least 20 characters."],
      maxlength: [2000, "Description cannot exceed 2000 characters."],
    },

    // Reference to Category collection
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Listing category is required."],
    },

    rentalPricePerDay: {
      type: Number,
      required: [true, "Rental price per day is required."],
      min: [0, "Rental price cannot be negative."],
    },

    location: {
      type: String,
      required: [true, "Location is required."],
      trim: true,
      minlength: [3, "Location must contain at least 3 characters."],
      maxlength: [200, "Location cannot exceed 200 characters."],
    },

    // Cloudinary or external image URLs
    images: {
      type: [String],
      default: [],
    },

    deposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative."],
    },

    amenities: {
      type: [String],
      default: [],
    },

    rules: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Rules cannot exceed 1000 characters."],
    },

    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },

    // Soft active flag for listing lifecycle management
    isActive: {
      type: Boolean,
      default: true,
    },

    // Owner-defined blackout / maintenance date ranges
    blockedDates: [
      {
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        reason: {
          type: String,
          default: "Maintenance / Personal Use",
          trim: true,
          maxlength: [200, "Reason cannot exceed 200 characters."],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Owner reference (User)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Listing", listingSchema);