import React from "react";

export function Skeleton({ width, height, radius = "sm", className = "", style = {} }) {
  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-lg",
    md: "rounded-xl",
    pill: "rounded-full",
  }[radius] || "rounded-lg";

  return (
    <div
      className={`animate-pulse bg-[var(--color-surface-secondary)] ${radiusClasses} ${className}`.trim()}
      style={{
        width: width || "100%",
        height: height || "1rem",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
      <Skeleton height="180px" radius="none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton width="40%" height="0.85rem" />
        <Skeleton width="85%" height="1.1rem" />
        <Skeleton width="60%" height="0.85rem" />
        <div className="flex justify-between items-center mt-2">
          <Skeleton width="30%" height="1.25rem" />
          <Skeleton width="25%" height="0.9rem" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
