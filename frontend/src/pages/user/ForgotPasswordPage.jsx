import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Input, Button, Card } from "../../components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate password reset request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="ambient-glow-wrapper min-h-[calc(100vh-72px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="w-full max-w-md mx-auto relative z-10">
        <Card padding="lg" variant="elevated" className="border-[var(--color-border)] shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-[var(--color-brand-primary)] grid place-items-center mx-auto mb-4 border border-indigo-500/20 shadow-sm">
              <KeyRound size={24} />
            </div>

            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)] mb-1.5 tracking-tight">
              Reset your password
            </h1>

            <p className="text-xs text-[var(--color-secondary-text)]">
              Enter your registered email and we'll transmit secure recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div
                className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 text-xs font-semibold mb-6 text-left"
                role="status"
              >
                <CheckCircle2 size={18} className="shrink-0" />
                <span>
                  Password reset link sent to <strong>{email}</strong>. Please check your inbox.
                </span>
              </div>

              <Link to="/login">
                <Button variant="primary" fullWidth>
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {error && (
                <div
                  className="p-3.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/25 text-xs font-semibold text-center"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                prefixIcon={Mail}
                autoComplete="email"
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
                Send Recovery Link
              </Button>
            </form>
          )}

          <div className="mt-7 pt-5 border-t border-[var(--color-border-subtle)] text-center text-xs text-[var(--color-muted-grey)]">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-[var(--color-brand-primary)] font-bold hover:underline">
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
