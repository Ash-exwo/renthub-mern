import React from "react";

export function Card({
  children,
  variant = "default", // default, elevated, flat, interactive, glass
  padding = "md", // none, sm, md, lg
  className = "",
  onClick,
  ...props
}) {
  const padClasses = {
    none: "p-0",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8 md:p-10",
  }[padding] || "p-4 sm:p-6";

  const variantClasses = {
    default: "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm",
    elevated: "bg-[var(--color-surface)] shadow-lg shadow-black/5 dark:shadow-black/20 border border-[var(--color-border)]/60",
    flat: "bg-[var(--color-surface-subtle)] border border-[var(--color-border)]",
    glass: "glass-panel shadow-lg shadow-black/5",
    interactive:
      "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-[var(--color-brand-primary)]/40 transition-all duration-200",
  }[variant] || "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm";

  const clickableClasses = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`rounded-2xl relative overflow-hidden transition-all duration-200 ${variantClasses} ${padClasses} ${clickableClasses} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`mb-4 pb-3 border-b border-[var(--color-border-subtle)] ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", ...props }) {
  return (
    <div className={`${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div className={`mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3 flex-wrap ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export default Card;
