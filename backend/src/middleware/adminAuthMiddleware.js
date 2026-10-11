const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");

const protectAdmin = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Admin authentication required. Please log in as admin.",
      });
    }

    const token = authorizationHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.adminId) {
      return res.status(401).json({
        message: "Invalid admin authentication token.",
      });
    }

    const admin = await Admin.findById(decoded.adminId).select("-password");

    if (!admin) {
      return res.status(401).json({
        message: "Admin account no longer exists.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Admin session is invalid or has expired. Please log in again.",
    });
  }
};

module.exports = protectAdmin;
