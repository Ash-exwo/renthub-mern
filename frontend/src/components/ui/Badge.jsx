import React from "react";

export function Badge({
  children,
  variant = "neutral", // primary, secondary, success, warning, danger, info, neutral
  size = "md", // sm, md
  dot = false,
  className = "",
  ...props
}) {
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[0.7rem]",
    md: "px-3 py-1 text-xs",
  }[size] || "px-3 py-1 text-xs";

  const variantClasses = {
    primary: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shadow-sm",
    secondary: "bg-[var(--color-surface-secondary)] text-[var(--color-espresso)] border border-[var(--color-border)]",
    neutral: "bg-[var(--color-surface-subtle)] text-[var(--color-secondary-text)] border border-[var(--color-border)]",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25",
    info: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25",
  }[variant] || "bg-[var(--color-surface-subtle)] text-[var(--color-secondary-text)] border border-[var(--color-border)]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-[var(--font-heading)] font-semibold rounded-full leading-none whitespace-nowrap tracking-wide ${sizeClasses} ${variantClasses} ${className}`.trim()}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor] shrink-0 animate-pulse" aria-hidden="true" />
      )}
      <span>{children}</span>
    </span>
  );
}

export function StatusBadge({ status, size = "md", className = "" }) {
  const norm = String(status || "").toLowerCase().trim();

  let variant = "neutral";
  let label = status;

  if (["available", "active", "approved", "completed", "published"].includes(norm)) {
    variant = "success";
    label = norm.charAt(0).toUpperCase() + norm.slice(1);
  } else if (["pending", "pending review", "upcoming"].includes(norm)) {
    variant = "warning";
    label = "Pending";
  } else if (["unavailable", "rejected", "suspended", "cancelled", "flagged"].includes(norm)) {
    variant = "danger";
    label = norm.charAt(0).toUpperCase() + norm.slice(1);
  } else if (["draft", "paused"].includes(norm)) {
    variant = "neutral";
    label = norm.charAt(0).toUpperCase() + norm.slice(1);
  } else if (["host", "verified"].includes(norm)) {
    variant = "primary";
    label = norm.charAt(0).toUpperCase() + norm.slice(1);
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
}

export default Badge;
