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
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
};
