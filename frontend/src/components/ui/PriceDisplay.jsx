import React from "react";

export function PriceDisplay({
  price,
  period = "day", // day, week, month, event
  size = "md", // sm, md, lg, xl
  currency = "₹",
  className = "",
}) {
  const formatted = Number(price || 0).toLocaleString("en-IN");

  const sizeClasses = {
    sm: { price: "text-base font-extrabold", period: "text-xs font-medium" },
    md: { price: "text-lg sm:text-xl font-extrabold", period: "text-xs sm:text-sm font-medium" },
    lg: { price: "text-2xl sm:text-3xl font-extrabold", period: "text-sm font-semibold" },
    xl: { price: "text-3xl sm:text-4xl font-extrabold", period: "text-base font-semibold" },
  }[size] || { price: "text-lg font-extrabold", period: "text-xs font-medium" };

  return (
    <div className={`inline-flex items-baseline gap-1 text-[var(--color-espresso)] font-[var(--font-heading)] ${className}`.trim()}>
      <span className={`tracking-tight tabular-nums ${sizeClasses.price}`}>
        <span className="text-sm font-bold opacity-80 mr-0.5">{currency}</span>
        {formatted}
      </span>
      {period && (
        <span className={`text-[var(--color-muted-grey)] ${sizeClasses.period}`}>
          /{period}
        </span>
      )}
    </div>
  );
}

export default PriceDisplay;
