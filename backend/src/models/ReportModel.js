const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter reference is required."],
      index: true,
    },
    targetType: {
      type: String,
      enum: ["listing", "user"],
      default: "listing",
      required: true,
    },
    targetListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Reported listing reference is required."],
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reported item owner reference is required."],
      index: true,
    },
    category: {
      type: String,
      enum: [
        "misleading",
        "scam_off_platform",
        "safety_hazard",
        "prohibited",
        "abusive_conduct",
        "other",
      ],
      required: [true, "Report violation category is required."],
    },
    reason: {
      type: String,
      required: [true, "Please provide detailed explanation of the violation."],
      trim: true,
      minlength: [10, "Report reason must be at least 10 characters long."],
      maxlength: [1000, "Report reason cannot exceed 1000 characters."],
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ["none", "warning_issued", "listing_paused", "listing_deleted"],
      default: "none",
    },
    adminNotes: {
      type: String,
      default: "",
      maxlength: [1000, "Admin notes cannot exceed 1000 characters."],
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent report spam: only one pending report per user per listing
reportSchema.index({ reporter: 1, targetListing: 1, status: 1 });

module.exports = mongoose.model("Report", reportSchema);
