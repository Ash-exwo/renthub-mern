const express = require("express");
const router = express.Router();

const {
  createDispute,
  getDisputeByBooking,
  renterRespondToDispute,
  getAdminDisputes,
  resolveDisputeByAdmin,
} = require("../controllers/disputeController");

const userAuth = require("../middleware/userAuthMiddleware");
const adminAuth = require("../middleware/adminAuthMiddleware");

// User routes
router.post("/", userAuth, createDispute);
router.get("/booking/:bookingId", userAuth, getDisputeByBooking);
router.post("/:id/respond", userAuth, renterRespondToDispute);

// Admin routes
router.get("/admin", adminAuth, getAdminDisputes);
router.patch("/admin/:id/resolve", adminAuth, resolveDisputeByAdmin);

module.exports = router;
