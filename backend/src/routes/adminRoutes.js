const express = require("express");
const router = express.Router();

const protectAdmin = require("../middleware/adminAuthMiddleware");
const { adminLogin, getAdminAnalytics } = require("../controllers/adminController");

router.post("/login", adminLogin);
router.get("/analytics", protectAdmin, getAdminAnalytics);

module.exports = router;
