const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protectUser } = require("../middleware/userAuthMiddleware");

// Public helper to view unavailable/reserved dates for an item's calendar
router.get("/listing/:listingId/booked-dates", bookingController.getBookedDatesForListing);

// Protected routes (Require logged-in user)
router.use(protectUser);

// Renter creates booking request
router.post("/", bookingController.createBooking);

// Renter view their bookings
router.get("/my-rentals", bookingController.getMyRentals);

// Owner view incoming requests for their items
router.get("/owner-requests", bookingController.getOwnerRequests);

// View single booking details
router.get("/:id", bookingController.getBookingById);

// Update status (Owner: confirm/reject/complete, Renter: cancel)
router.patch("/:id/status", bookingController.updateBookingStatus);

module.exports = router;
