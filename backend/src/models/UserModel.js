const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: [3, "Full name must contain at least 3 characters."],
      maxlength: [60, "Full name cannot exceed 60 characters."],
    },

    email: {
      type: String,
      required: [true, "Email address is required."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address.",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must contain at least 6 characters."],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      match: [/^\d{10}$/, "Phone number must contain exactly 10 digits."],
    },

    location: {
      type: String,
      required: [true, "Location is required."],
      trim: true,
      minlength: [3, "Location must contain at least 3 characters."],
      maxlength: [100, "Location cannot exceed 100 characters."],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
