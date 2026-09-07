import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";

// Slightly tighter input padding to fit inside 100vh cleanly
const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.55rem 0.85rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  outline: "none",
  transition: "var(--transition-fast)",
  fontSize: "0.9rem",
};

const ErrorMessage = ({ error }) => (
  <AnimatePresence>
    {error && (
      <motion.div
        initial={{ opacity: 0, y: -6, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -6, height: 0 }}
        style={{ overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "#b42318",
            fontSize: "0.8rem",
            marginTop: "0.25rem",
          }}
        >
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const nextErrors = {};
    const email = formData.email.trim();
    const name = formData.name.trim();
    const location = formData.location.trim();

    if (name.length < 3)
      nextErrors.name = "Full name must contain at least 3 characters.";
    
    // STRICT EMAIL CHECK: Ensures valid email format ending with .com
    if (!/^[^\s@]+@[^\s@]+\.com$/i.test(email))
      nextErrors.email = "Enter a valid email ending in .com (e.g. name@gmail.com).";

    if (formData.password.length < 6)
      nextErrors.password = "Password must contain at least 6 characters.";
    if (!/^\d{10}$/.test(formData.phone))
      nextErrors.phone = "Phone number must contain exactly 10 digits.";
    if (location.length < 3)
      nextErrors.location = "Location must contain at least 3 characters.";

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await axios.post("http://localhost:5000/api/auth/register", formData);
      navigate("/login", {
        state: {
          successMessage: "Registration completed successfully. Please log in.",
        },
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      if (error.response?.data?.field === "email") {
        setErrors({ email: message });
      } else {
        setServerError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <motion.section
        className="welcome-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "30rem",
          boxSizing: "border-box",
          textAlign: "left",
          padding: "1.5rem 1.75rem",
        }}
      >
        <span className="welcome-card__label" style={{ fontSize: "0.8rem" }}>
          Get Started
        </span>
        <h1
          className="welcome-card__title"
          style={{ fontSize: "1.85rem", margin: "0.2rem 0 0 0" }}
        >
          Create Account
        </h1>
        <p
          className="welcome-card__description"
          style={{
            marginTop: "0.25rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          Join RentHub to find your next space or list properties effortlessly.
        </p>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 0.75rem",
                background: "#fef3f2",
                color: "#b42318",
                borderRadius: "var(--radius-sm)",
                marginBottom: "0.85rem",
                fontSize: "0.85rem",
              }}
            >
              <AlertCircle size={16} />
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <form
          noValidate
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}
        >
          <div>
            <label
              htmlFor="name"
              style={{ fontSize: "0.825rem", fontWeight: 500 }}
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              autoComplete="name"
              style={inputStyle}
            />
            <ErrorMessage error={errors.name} />
          </div>

          <div>
            <label
              htmlFor="email"
              style={{ fontSize: "0.825rem", fontWeight: 500 }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@gmail.com"
              autoComplete="email"
              style={inputStyle}
            />
            <ErrorMessage error={errors.email} />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ fontSize: "0.825rem", fontWeight: 500 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              style={inputStyle}
            />
            <ErrorMessage error={errors.password} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label
                htmlFor="phone"
                style={{ fontSize: "0.825rem", fontWeight: 500 }}
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                inputMode="numeric"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10 digits"
                autoComplete="tel"
                style={inputStyle}
              />
              <ErrorMessage error={errors.phone} />
            </div>

            <div>
              <label
                htmlFor="location"
                style={{ fontSize: "0.825rem", fontWeight: 500 }}
              >
                Location
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                autoComplete="address-level2"
                style={inputStyle}
              />
              <ErrorMessage error={errors.location} />
            </div>
          </div>

          {/* FIXED: Changed justify to justifyContent */}
          <div
            className="welcome-card__actions"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "0.5rem",
            }}
          >
            <span
              style={{ fontSize: "0.85rem", color: "var(--color-muted-grey)" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "var(--color-terracotta)",
                  fontWeight: 600,
                }}
              >
                Log in
              </Link>
            </span>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="button button--primary"
            >
              {loading ? "Creating..." : "Register"}
            </motion.button>
          </div>
        </form>
      </motion.section>
    </AnimatedBackground>
  );
}