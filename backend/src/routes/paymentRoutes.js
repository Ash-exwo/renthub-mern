const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protectUser } = require("../middleware/userAuthMiddleware");

// All payment routes require authenticated user
router.use(protectUser);

// Renter prepares checkout session
router.post("/checkout-session", paymentController.createCheckoutSession);

// Renter processes test-mode payment (authorizes escrow & deposit)
router.post("/process", paymentController.processPayment);

// Renter or Owner views receipt, escrow status & deposit ledger
router.get("/booking/:bookingId", paymentController.getPaymentByBooking);

module.exports = router;
