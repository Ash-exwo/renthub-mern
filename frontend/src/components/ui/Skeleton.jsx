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
    <div className="h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
      <Skeleton height="208px" radius="none" />
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-4">
        <div className="space-y-2">
          <Skeleton width="40%" height="0.85rem" />
          <Skeleton width="85%" height="1.1rem" />
          <Skeleton width="60%" height="0.85rem" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border-subtle)]">
          <Skeleton width="35%" height="1.25rem" />
          <Skeleton width="25%" height="1.5rem" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
