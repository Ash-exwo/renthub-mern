const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Renter reference is required."],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner reference is required."],
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing reference is required."],
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    lastMessage: {
      type: String,
      default: "",
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCountRenter: {
      type: Number,
      default: 0,
      min: 0,
    },
    unreadCountOwner: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "archived", "blocked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// One ongoing conversation thread per listing between a specific renter and host
conversationSchema.index({ listing: 1, renter: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
