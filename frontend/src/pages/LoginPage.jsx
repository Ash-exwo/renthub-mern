import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.65rem 0.9rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  outline: "none",
  transition: "var(--transition-fast)",
  fontSize: "0.9rem",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(location.state?.successMessage || "");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync navigation state directly when redirecting from register
  useEffect(() => {
    if (location.state?.successMessage) {
      setMessage(location.state.successMessage);
      setIsError(false);
    }
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    
    // Only clear error messages on input change, keep success banner visible
    if (isError) {
      setMessage("");
      setIsError(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = formData.email.trim();

    if (!/^[^\s@]+@[^\s@]+\.com$/i.test(email)) {
      setIsError(true);
      setMessage("Enter a valid email address ending in .com.");
      return;
    }

    if (!formData.password) {
      setIsError(true);
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password: formData.password,
      });

      navigate("/", {
        state: { successMessage: "Login completed successfully." },
      });
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message || "Unable to log in. Please try again."
      );
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
          maxWidth: "26rem",
          boxSizing: "border-box",
          padding: "1.75rem 2rem",
          textAlign: "left",
        }}
      >
        <span className="welcome-card__label" style={{ fontSize: "0.8rem" }}>
          Welcome Back
        </span>
        <h1
          className="welcome-card__title"
          style={{ fontSize: "2rem", margin: "0.2rem 0 0 0" }}
        >
          Log In
        </h1>
        <p
          className="welcome-card__description"
          style={{
            marginTop: "0.25rem",
            marginBottom: "1.25rem",
            fontSize: "0.875rem",
          }}
        >
          Enter your credentials to access your RentHub account.
        </p>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              role={isError ? "alert" : "status"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                background: isError ? "#fef3f2" : "#ecfdf3",
                color: isError ? "#b42318" : "#027a48",
                marginBottom: "1rem",
                fontSize: "0.85rem",
              }}
            >
              {isError ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <form
          noValidate
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label
              htmlFor="email"
              style={{ fontSize: "0.85rem", fontWeight: 500 }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.2rem",
              }}
            >
              <label
                htmlFor="password"
                style={{ fontSize: "0.85rem", fontWeight: 500 }}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-terracotta)",
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>

            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                style={{
                  position: "absolute",
                  right: "0.65rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--color-muted-grey)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div
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
              New here?{" "}
              <Link
                to="/register"
                style={{
                  color: "var(--color-terracotta)",
                  fontWeight: 600,
                }}
              >
                Create an account
              </Link>
            </span>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="button button--primary"
            >
              {loading ? "Logging in..." : "Log In"}
            </motion.button>
          </div>
        </form>
      </motion.section>
    </AnimatedBackground>
  );
}