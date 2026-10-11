// Category = grouping for rental listings
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      unique: true,
      trim: true,
      minlength: [2, "Category name must contain at least 2 characters."],
      maxlength: [60, "Category name cannot exceed 60 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."],
      default: "",
    },

    icon: {
      type: String,
      trim: true,
      default: "📦",
      maxlength: [10, "Icon cannot exceed 10 characters."],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
