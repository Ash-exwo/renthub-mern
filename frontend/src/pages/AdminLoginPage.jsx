import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
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

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = formData.username.trim();

    if (!username || !formData.password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/login",
        {
          username,
          password: formData.password,
        }
      );

      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem(
        "adminUser",
        JSON.stringify(response.data.admin)
      );

      navigate("/admin/dashboard");
    } catch (error) {
      setError(
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
          RentHub Administration
        </span>
        <h1
          className="welcome-card__title"
          style={{ fontSize: "2rem", margin: "0.2rem 0 0 0" }}
        >
          Admin Login
        </h1>
        <p
          className="welcome-card__description"
          style={{
            marginTop: "0.25rem",
            marginBottom: "1.25rem",
            fontSize: "0.875rem",
          }}
        >
          Sign in to manage the RentHub platform.
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                background: "#fef3f2",
                color: "#b42318",
                marginBottom: "1rem",
                fontSize: "0.85rem",
              }}
            >
              <AlertCircle size={16} />
              {error}
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
              htmlFor="username"
              style={{ fontSize: "0.85rem", fontWeight: 500 }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter admin username"
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ fontSize: "0.85rem", fontWeight: 500 }}
            >
              Password
            </label>
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
                aria-label={showPassword ? "Hide password" : "Show password"}
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
            <Link
              to="/login"
              style={{
                fontSize: "0.85rem",
                color: "var(--color-muted-grey)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              User Login
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="button button--primary"
            >
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
          </div>
        </form>
      </motion.section>
    </AnimatedBackground>
  );
}