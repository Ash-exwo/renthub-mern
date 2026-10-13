const mongoose = require("mongoose");
const Category = require("../models/CategoryModel");

// Step 5: Admin creates category
// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    // Check duplicate (case-insensitive check for user friendliness)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category with this name already exists.",
      });
    }

    // Create Category (defaults to isActive: true)
    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      icon: icon ? icon.trim() : "📦",
      isActive: true,
    });

    return res.status(201).json({
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category with this name already exists.",
      });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(" ");

      return res.status(400).json({ message });
    }

    console.error("Create category error:", error);

    return res.status(500).json({
      message: "Unable to create category. Please try again.",
    });
  }
};

// Step 6: Public / Authenticated user retrieves active categories
// GET /api/categories (returns only isActive: true)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    return res.status(200).json({
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get active categories error:", error);

    return res.status(500).json({
      message: "Unable to load categories. Please try again.",
    });
  }
};

// Step 7: Admin retrieves all categories (both active and inactive)
// GET /api/categories/admin
exports.getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    return res.status(200).json({
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get admin categories error:", error);

    return res.status(500).json({
      message: "Unable to load admin categories. Please try again.",
    });
  }
};

// Step 8: Admin updates category details
// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID format.",
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        message: "Category name cannot be empty.",
      });
    }

    // Check duplicate name excluding current category
    if (name !== undefined) {
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });

      if (duplicate) {
        return res.status(400).json({
          message: "Another category with this name already exists.",
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (icon !== undefined) updateData.icon = icon.trim() || "📦";

    const category = await Category.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category with this name already exists.",
      });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(" ");

      return res.status(400).json({ message });
    }

    console.error("Update category error:", error);

    return res.status(500).json({
      message: "Unable to update category. Please try again.",
    });
  }
};

// Step 9: Admin activates or deactivates category (No delete)
// PATCH /api/categories/:id/status
exports.updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID format.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    // If isActive is explicitly provided, set it; otherwise toggle current status
    category.isActive = isActive !== undefined ? Boolean(isActive) : !category.isActive;
    await category.save();

    const statusText = category.isActive ? "activated" : "deactivated";

    return res.status(200).json({
      message: `Category successfully ${statusText}.`,
      category,
    });
  } catch (error) {
    console.error("Update category status error:", error);

    return res.status(500).json({
      message: "Unable to update category status. Please try again.",
    });
  }
};
