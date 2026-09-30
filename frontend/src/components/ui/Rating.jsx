import React from "react";
import { Star } from "lucide-react";

export function Rating({ score = 4.8, reviewsCount, size = 14, showCount = true, className = "" }) {
  const formattedScore = Number(score || 0).toFixed(1);

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs font-bold text-[var(--color-espresso)] ${className}`.trim()}
      aria-label={`Rating: ${formattedScore} out of 5 stars`}
    >
      <Star size={size} className="fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]" />
      <span>{formattedScore}</span>
      {showCount && reviewsCount !== undefined && (
        <span className="text-[var(--color-muted-grey)] font-normal text-[11px]">
          ({reviewsCount})
        </span>
      )}
    </div>
  );
}

export default Rating;
