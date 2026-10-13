const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protectUser } = require("../middleware/userAuthMiddleware");
const protectAdmin = require("../middleware/adminAuthMiddleware");

// User routes (Submit flag / report on listing)
router.post("/", protectUser, reportController.createReport);

// Admin routes (Moderation console)
router.get("/admin", protectAdmin, reportController.getAdminReports);
router.patch("/admin/:id/action", protectAdmin, reportController.actionReport);

module.exports = router;
