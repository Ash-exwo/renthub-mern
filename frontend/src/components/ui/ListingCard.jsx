import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart, Sparkles } from "lucide-react";
import { Badge, StatusBadge } from "./Badge";
import Rating from "./Rating";
import PriceDisplay from "./PriceDisplay";

export function ListingCard({
  listing,
  isFavorite = false,
  onToggleFavorite,
  className = "",
}) {
  const [favorite, setFavorite] = useState(isFavorite);

  if (!listing) return null;

  const {
    _id,
    id = _id,
    title,
    category,
    rentalPricePerDay,
    location,
    images = [],
    availability = "available",
    rating = 4.8,
  } = listing;

  const displayImage =
    images && images.length > 0 && images[0]
      ? images[0]
      : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60";

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorite;
    setFavorite(next);
    if (onToggleFavorite) {
      onToggleFavorite(listing, next);
    }
  };

  return (
    <div
      className={`group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brand-primary)]/40 hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.5)] flex flex-col relative ${className}`.trim()}
    >
      <Link to={`/listings/${id}`} className="flex flex-col h-full text-inherit no-underline" aria-label={title}>
        {/* Solid Photo Container (Will NEVER collapse) */}
        <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0" style={{ height: "216px" }}>
          <img
            src={displayImage}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60";
            }}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Top Glass Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            {category && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white border border-white/20 shadow-sm">
                {category}
              </span>
            )}
            {availability === "available" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-400/30 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Available
              </span>
            ) : (
              <StatusBadge status={availability} size="sm" />
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md border border-white/25 grid place-items-center cursor-pointer transition-all duration-200 hover:scale-110 z-10 ${
              favorite ? "text-[var(--color-brand-primary)]" : "text-white"
            }`}
            aria-label={favorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={15}
              className={`transition-transform duration-200 ${
                favorite
                  ? "fill-[var(--color-brand-primary)] text-[var(--color-brand-primary)] scale-110"
                  : "text-white"
              }`}
            />
          </button>
        </div>

        {/* Card Details */}
        <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1 bg-[var(--color-surface)]">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-[var(--font-heading)] font-bold text-base text-[var(--color-espresso)] line-clamp-1 group-hover:text-[var(--color-brand-primary)] transition-colors duration-150"
              title={title}
            >
              {title}
            </h3>
            <Rating score={rating} showCount={false} />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-grey)]">
            <MapPin size={13} className="shrink-0 text-[var(--color-brand-primary)]" />
            <span className="truncate">{location}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <PriceDisplay price={rentalPricePerDay} period="day" size="sm" />
            <span className="text-xs font-bold text-[var(--color-brand-primary)] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-brand-primary-subtle)]">
              <span>View</span>
              <span>&rarr;</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ListingCard;
