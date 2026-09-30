import React from "react";

export function Button({
  children,
  variant = "primary", // primary, secondary, outline, ghost, danger
  size = "md", // sm, md, lg
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  type = "button",
  onClick,
  fullWidth = false,
  ...props
}) {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs min-h-[36px] rounded-lg font-semibold",
    md: "px-5 py-2.5 text-sm min-h-[44px] rounded-xl font-semibold",
    lg: "px-7 py-3 text-base min-h-[52px] rounded-xl font-bold",
  }[size] || "px-5 py-2.5 text-sm min-h-[44px] rounded-xl font-semibold";

  const variantClasses = {
    primary:
      "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 hover:-translate-y-0.5 active:translate-y-0",
    secondary:
      "bg-[var(--color-surface-secondary)] text-[var(--color-espresso)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-brand-primary)] hover:-translate-y-0.5 active:translate-y-0",
    outline:
      "bg-[var(--color-surface)] text-[var(--color-espresso)] border border-[var(--color-border)] hover:bg-[var(--color-brand-primary-subtle)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:-translate-y-0.5 active:translate-y-0",
    ghost:
      "bg-transparent text-[var(--color-espresso)] hover:bg-[var(--color-brand-primary-subtle)] hover:text-[var(--color-brand-primary)]",
    danger:
      "bg-rose-600 text-white border border-rose-600 shadow-md shadow-rose-500/25 hover:bg-rose-700 hover:-translate-y-0.5 active:translate-y-0",
  }[variant] || "";

  const baseClasses = `inline-flex items-center justify-center gap-2 font-[var(--font-heading)] tracking-tight cursor-pointer transition-all duration-150 select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
    fullWidth ? "w-full" : ""
  } ${sizeClasses} ${variantClasses} ${className}`;

  return (
    <button
      type={type}
      className={baseClasses.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span
          className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin shrink-0"
          aria-hidden="true"
        />
      ) : (
        <>
          {Icon && iconPosition === "left" && (
            <Icon
              size={size === "sm" ? 14 : size === "lg" ? 20 : 16}
              className="shrink-0"
            />
          )}
          <span>{children}</span>
          {Icon && iconPosition === "right" && (
            <Icon
              size={size === "sm" ? 14 : size === "lg" ? 20 : 16}
              className="shrink-0"
            />
          )}
        </>
      )}
    </button>
  );
}

export default Button;
