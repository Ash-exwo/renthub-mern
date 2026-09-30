import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import api from "../../utils/api";
import { Input, Button, Card } from "../../components/ui";

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
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Enter your full name (at least 2 characters).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      errs.email = "Enter a valid email address (e.g. name@example.com).";
    }
    if (!formData.password || formData.password.length < 6) {
      errs.password = "Password must contain at least 6 characters.";
    }
    if (!/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = "Enter a valid 10-digit mobile phone number.";
    }
    if (!formData.location.trim()) {
      errs.location = "Enter your primary city or area (e.g. Kochi, Bangalore).";
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        location: formData.location.trim(),
      });

      navigate("/login", {
        state: {
          successMessage: "Account created successfully! Please sign in with your credentials.",
        },
      });
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambient-glow-wrapper min-h-[calc(100vh-72px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="w-full max-w-lg mx-auto relative z-10">
        <Card padding="lg" variant="elevated" className="border-[var(--color-border)] shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wider border border-indigo-500/20 mb-3">
              <Sparkles size={13} className="text-cyan-500" />
              <span>Join The Community</span>
            </div>

            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)] mb-1.5 tracking-tight">
              Create your account
            </h1>

            <p className="text-sm text-[var(--color-secondary-text)]">
              Join thousands of verified renters and asset hosts today.
            </p>
          </div>

          {serverError && (
            <div
              className="p-3.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/25 text-xs font-semibold mb-5 text-center"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="Jane Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              prefixIcon={User}
              autoComplete="name"
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              prefixIcon={Mail}
              autoComplete="email"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                prefixIcon={Phone}
                autoComplete="tel"
                required
              />

              <Input
                label="City / Location"
                name="location"
                placeholder="Kochi, Kerala"
                value={formData.location}
                onChange={handleChange}
                error={errors.location}
                prefixIcon={MapPin}
                autoComplete="address-level2"
                required
              />
            </div>

            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              prefixIcon={Lock}
              suffixIcon={showPassword ? EyeOff : Eye}
              onSuffixClick={() => setShowPassword((prev) => !prev)}
              autoComplete="new-password"
              helperText="Must be at least 6 characters long."
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              Create RentHub Account
            </Button>
          </form>

          <div className="mt-7 pt-5 border-t border-[var(--color-border-subtle)] text-center text-xs text-[var(--color-muted-grey)]">
            Already have an account?{" "}
            <Link to="/login" className="text-[var(--color-brand-primary)] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-[var(--color-muted-grey)] text-center">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>By signing up, you agree to our Escrow Terms & Damage Protection Policies</span>
        </div>
      </div>
    </div>
  );
}
