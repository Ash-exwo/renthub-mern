const express = require("express");
const router = express.Router();

const protectAdmin = require("../middleware/adminAuthMiddleware");
const {
  createCategory,
  getCategories,
  getAdminCategories,
  updateCategory,
  updateCategoryStatus,
} = require("../controllers/categoryController");

// Public / Authenticated: Get active categories (for listings, search dropdowns, etc.)
router.get("/", getCategories);

// Admin-Only: Get all categories (active and inactive)
router.get("/admin", protectAdmin, getAdminCategories);

// Admin-Only: Create category
router.post("/", protectAdmin, createCategory);

// Admin-Only: Edit category (name, description)
router.put("/:id", protectAdmin, updateCategory);

// Admin-Only: Activate / Deactivate category (No delete)
router.patch("/:id/status", protectAdmin, updateCategoryStatus);

module.exports = router;
