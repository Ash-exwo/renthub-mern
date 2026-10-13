import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Zap } from "lucide-react";
import api from "../../utils/api";
import { isLoggedIn } from "../../utils/auth";
import { Input, Button, Card } from "../../components/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/explore", { replace: true });
    }
  }, [navigate]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(location.state?.successMessage || location.state?.notice || "");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.successMessage) {
      setMessage(location.state.successMessage);
      setIsError(false);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (isError) {
      setMessage("");
      setIsError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = formData.email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      setIsError(true);
      setMessage("Enter a valid email address (e.g. name@example.com).");
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
      const response = await api.post("/auth/login", {
        email,
        password: formData.password,
      });

      localStorage.setItem("userToken", response.data.token);
      localStorage.setItem("userData", JSON.stringify(response.data.user));

      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message || "Invalid credentials. Please verify your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambient-glow-wrapper min-h-[calc(100vh-72px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="w-full max-w-md mx-auto relative z-10">
        <Card padding="lg" variant="elevated" className="border-[var(--color-border)] shadow-2xl backdrop-blur-xl">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wider border border-indigo-500/20 mb-3">
              <Zap size={13} />
              <span>Secure Access</span>
            </div>

            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)] mb-1.5 tracking-tight">
              Welcome back
            </h1>

            <p className="text-sm text-[var(--color-secondary-text)]">
              Sign in to manage your rentals, bookings, and host inquiries.
            </p>
          </div>

          {/* Feedback alert banner */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-semibold mb-5 border ${
                isError
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/25"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
              }`}
              role="alert"
            >
              {isError ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              id="login-email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              prefixIcon={Mail}
              autoComplete="email"
              required
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-[var(--color-espresso)]" htmlFor="login-password">
                  Password <span className="text-[var(--color-brand-primary)]">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--color-brand-primary)] font-bold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                prefixIcon={Lock}
                suffixIcon={showPassword ? EyeOff : Eye}
                onSuffixClick={() => setShowPassword((prev) => !prev)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              Sign In to RentHub
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-7 pt-5 border-t border-[var(--color-border-subtle)] text-center text-xs text-[var(--color-muted-grey)]">
            New to RentHub?{" "}
            <Link to="/register" className="text-[var(--color-brand-primary)] font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </Card>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-[var(--color-muted-grey)] font-medium">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>256-bit SSL encrypted secure connection</span>
        </div>
      </div>
    </div>
  );
}
