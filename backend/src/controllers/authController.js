// Controller = WHAT should happen?
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phone?.replace(/\D/g, "");
    const cleanLocation = location?.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !cleanPhone ||
      !cleanLocation
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(409).json({
        field: "email",
        message: "An account already exists with this email address.",
      });
    }

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      phone: cleanPhone,
      location: cleanLocation,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      message: "Registration completed successfully.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        field: "email",
        message: "An account already exists with this email address.",
      });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(" ");

      return res.status(400).json({ message });
    }

    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Unable to create your account. Please try again.",
    });
  }
};


// req = Request from the frontend, res = Response to the frontend
exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email address and password are required.",
      });
    }

    const user = await User.findOne({ email });

    // Keep this deliberately generic: do not reveal whether an email exists.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email address or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Login completed successfully.",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        location: user.location || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
};

// Authenticated user updates their personal profile
// PUT /api/auth/profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    if (name !== undefined) {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 3) {
        return res.status(400).json({
          message: "Full name must contain at least 3 characters.",
        });
      }
      user.name = cleanName;
    }

    if (phone !== undefined) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({
          message: "Phone number must contain exactly 10 digits.",
        });
      }
      user.phone = cleanPhone;
    }

    if (location !== undefined) {
      const cleanLocation = location.trim();
      if (!cleanLocation || cleanLocation.length < 3) {
        return res.status(400).json({
          message: "Location must contain at least 3 characters.",
        });
      }
      user.location = cleanLocation;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(" ");
      return res.status(400).json({ message });
    }

    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Unable to update profile. Please try again.",
    });
  }
};

// Admin: Get all registered users from MongoDB
// GET /api/auth/admin/users
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return res.status(500).json({ message: "Unable to load users." });
  }
};

// Admin: Delete user from MongoDB
// DELETE /api/auth/admin/users/:id
exports.adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: "User deleted successfully from database." });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user." });
  }
};
