const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protectUser } = require("../middleware/userAuthMiddleware");

// Public route: fetch all reviews & breakdown for a listing
router.get("/listing/:listingId", reviewController.getListingReviews);

// Protected routes below
router.post("/", protectUser, reviewController.createReview);
router.get("/booking/:bookingId", protectUser, reviewController.getBookingReview);
router.delete("/:id", protectUser, reviewController.deleteReview);

module.exports = router;
