import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowLeft, Zap } from "lucide-react";
import api from "../../utils/api";
import { Input, Button, Card } from "../../components/ui";
import ThemeToggle from "../../components/ThemeToggle";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = formData.username.trim();

    if (!username || !formData.password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/admin/login", {
        username,
        password: formData.password,
      });

      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminUser", JSON.stringify(response.data.admin));

      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid administrative credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambient-glow-wrapper min-h-screen flex flex-col justify-between bg-[var(--color-canvas)] text-[var(--color-espresso)] p-4 sm:p-6 lg:p-8 font-[var(--font-sans)] transition-colors duration-200">
      {/* Top Floating Utility Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 mb-4 sm:mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)] transition-colors p-2 rounded-xl hover:bg-[var(--color-surface-subtle)]"
        >
          <ArrowLeft size={16} />
          <span>Return to Marketplace</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-muted-grey)] font-medium hidden sm:inline">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto relative z-10 my-auto">
        <Card
          padding="lg"
          variant="elevated"
          className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl backdrop-blur-xl"
        >
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)] grid place-items-center mx-auto mb-3.5 border border-rose-500/20 shadow-md shadow-rose-500/10">
              <ShieldCheck size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)] text-[11px] font-extrabold uppercase tracking-wider border border-rose-500/20 mb-2">
              <Zap size={12} />
              <span>Platform Administration</span>
            </div>

            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-black text-[var(--color-espresso)] mb-1.5 tracking-tight">
              Admin Console Login
            </h1>

            <p className="text-xs sm:text-sm text-[var(--color-secondary-text)]">
              Authorized system administration credentials required.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs mb-5 text-center font-semibold"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Username"
              id="admin-username"
              name="username"
              placeholder="e.g. admin"
              value={formData.username}
              onChange={handleChange}
              prefixIcon={User}
              required
              autoComplete="username"
            />

            <Input
              label="Password"
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              prefixIcon={Lock}
              suffixIcon={showPassword ? EyeOff : Eye}
              onSuffixClick={() => setShowPassword((prev) => !prev)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2 font-bold shadow-md shadow-rose-500/25 cursor-pointer"
            >
              Sign In to Console &rarr;
            </Button>
          </form>

          {/* Card Footer */}
          <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] text-center">
            <p className="text-[11px] text-[var(--color-muted-grey)]">
              RentHub Marketplace Secure Administration Console • Confidential
            </p>
          </div>
        </Card>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full text-center py-4 text-xs text-[var(--color-muted-grey)] z-10">
        &copy; {new Date().getFullYear()} RentHub Inc. All rights reserved.
      </div>
    </div>
  );
}
