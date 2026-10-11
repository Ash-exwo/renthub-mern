const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const protectUser = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const token = authorizationHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    // Makes the logged-in user available to the next route handler.
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your session is invalid or has expired. Please log in again.",
    });
  }
};

/**
 * Optional authentication middleware for public browsing routes.
 * If token is present and valid, attaches req.user.
 * If absent or invalid, silently continues as guest (req.user = null).
 */
const optionalProtectUser = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      const token = authorizationHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded && decoded.userId) {
        const user = await User.findById(decoded.userId).select("-password");
        if (user) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // Silently continue without error for optional authentication
    req.user = null;
  }
  next();
};

module.exports = protectUser;
module.exports.protectUser = protectUser;
module.exports.optionalProtectUser = optionalProtectUser;