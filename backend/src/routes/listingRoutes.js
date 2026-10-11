const express = require("express");
const router = express.Router();

const {
  protectUser,
  optionalProtectUser,
} = require("../middleware/userAuthMiddleware");
const protectAdmin = require("../middleware/adminAuthMiddleware");

const {
  createListing,
  getMyListings,
  getListingById,
  updateListing,
  updateListingStatus,
  getAllListings,
  deleteListing,
  getAdminListings,
  adminUpdateListingStatus,
  adminDeleteListing,
} = require("../controllers/listingController");

// Public browsing & category filtering (Steps 20 & 21) - optional auth excludes owner's own listings in Renter mode
router.get("/", optionalProtectUser, getAllListings);

// Admin listing management (100% live MongoDB) - Must come before /:id
router.get("/admin/all", protectAdmin, getAdminListings);
router.patch("/admin/:id/status", protectAdmin, adminUpdateListingStatus);
router.delete("/admin/:id", protectAdmin, adminDeleteListing);

// Authenticated owner listings (Part 2) - Must come before /:id route
router.get("/my", protectUser, getMyListings);
router.get("/my-listings", protectUser, getMyListings);

// Single listing details (Step 17)
router.get("/:id", getListingById);

// Create new listing linked to Category ObjectId (Part 2)
router.post("/", protectUser, createListing);

// Update listing with ownership check (Step 18)
router.put("/:id", protectUser, updateListing);

// Activate / Deactivate listing status (Step 19)
router.patch("/:id/status", protectUser, updateListingStatus);

// Delete listing (Owner only)
router.delete("/:id", protectUser, deleteListing);

module.exports = router;