import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "../../utils/api";
import { Input, Button, Card, Badge } from "../../components/ui";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-[var(--font-sans)]">
      <div className="w-full max-w-md">
        <Card padding="lg" className="bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 grid place-items-center mx-auto mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
              <Shield size={28} />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Platform Control
            </span>
            <h1 className="font-[var(--font-heading)] text-2xl font-bold mt-1.5 mb-1 text-white">
              Admin Console Login
            </h1>
            <p className="text-slate-400 text-xs">
              Authorized system administration credentials required.
            </p>
          </div>

          {error && (
            <div
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs mb-5 text-center font-medium"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              className="mt-2"
            >
              Sign In to Console
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Return to RentHub Marketplace</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
