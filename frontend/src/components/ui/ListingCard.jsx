import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import { StatusBadge } from "./Badge";
import Rating from "./Rating";
import PriceDisplay from "./PriceDisplay";

export function ListingCard({
  listing,
  isFavorite = false,
  onToggleFavorite,
  className = "",
  isPreview = false,
}) {
  if (!listing) return null;

  const {
    _id,
    id = _id,
    title = "",
    category = "",
    rentalPricePerDay = 0,
    location = "",
    images = [],
    availability = "available",
    rating = 4.8,
  } = listing;

  const itemId = _id || id;
  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60";

  const [favorite, setFavorite] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("renthub_favorites") || "[]");
      return isFavorite || stored.some((item) => (item._id || item.id) === itemId);
    } catch {
      return isFavorite;
    }
  });

  const categoryName =
    typeof category === "object" && category !== null ? category.name : category;
  const categoryIcon =
    typeof category === "object" && category !== null ? category.icon : null;

  const displayImage =
    images && images.length > 0 && images[0]
      ? images[0]
      : FALLBACK_IMAGE;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPreview) return;

    const next = !favorite;
    setFavorite(next);

    try {
      const stored = JSON.parse(localStorage.getItem("renthub_favorites") || "[]");
      let updated;
      if (next) {
        if (!stored.some((item) => (item._id || item.id) === itemId)) {
          updated = [listing, ...stored];
        } else {
          updated = stored;
        }
      } else {
        updated = stored.filter((item) => (item._id || item.id) !== itemId);
      }
      localStorage.setItem("renthub_favorites", JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (onToggleFavorite) {
      onToggleFavorite(listing, next);
    }
  };

  const CardWrapper = isPreview ? "div" : Link;
  const wrapperProps = isPreview
    ? { className: "flex flex-col h-full text-inherit select-none" }
    : {
        to: `/listings/${itemId}`,
        className: "flex flex-col h-full text-inherit no-underline",
        "aria-label": title,
      };

  return (
    <div
      className={`group h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden transition-all duration-300 ${
        isPreview
          ? "shadow-sm border-indigo-500/30"
          : "hover:-translate-y-1.5 hover:border-[var(--color-brand-primary)]/40 hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.5)]"
      } flex flex-col relative ${className}`.trim()}
    >
      <CardWrapper {...wrapperProps}>
        {/* Solid Photo Container (Fixed uniform height across all cards) */}
        <div className="relative w-full h-52 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          <img
            src={displayImage}
            alt={title || "Listing preview"}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Top-Left Category Badge (Guaranteed no overlap with heart button) */}
          {categoryName && (
            <div className="absolute top-3 left-3 max-w-[calc(100%-52px)] z-10">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white border border-white/20 shadow-sm inline-flex items-center gap-1 truncate max-w-full">
                {categoryIcon && <span className="shrink-0 text-xs">{categoryIcon}</span>}
                <span className="truncate">{categoryName}</span>
              </span>
            </div>
          )}

          {/* Top-Right Wishlist Heart Button or Preview Badge */}
          {isPreview ? (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-bold shadow-sm uppercase tracking-wider backdrop-blur-sm z-10">
              Live Preview
            </div>
          ) : (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md border border-white/25 grid place-items-center cursor-pointer transition-all duration-200 hover:scale-110 z-10 shrink-0 ${
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
          )}

          {/* Bottom-Left Availability Status Badge (Separated from Category & Heart) */}
          <div className="absolute bottom-3 left-3 z-10">
            {availability === "available" ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-400/30 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Available
              </span>
            ) : (
              <StatusBadge status={availability} size="sm" />
            )}
          </div>
        </div>

        {/* Card Details (Balanced flex layout ensuring uniform height and baseline) */}
        <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 bg-[var(--color-surface)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="font-[var(--font-heading)] font-bold text-base text-[var(--color-espresso)] line-clamp-1 group-hover:text-[var(--color-brand-primary)] transition-colors duration-150 flex-1 leading-snug"
                title={title}
              >
                {title || "Untitled Listing"}
              </h3>
              <div className="shrink-0 pt-0.5">
                <Rating score={rating} showCount={false} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-grey)]">
              <MapPin size={13} className="shrink-0 text-[var(--color-brand-primary)]" />
              <span className="truncate">{location || "Location not set"}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <PriceDisplay price={rentalPricePerDay} period="day" size="sm" />
            <span className="text-xs font-bold text-[var(--color-brand-primary)] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-brand-primary-subtle)] shrink-0">
              <span>{isPreview ? "Card Preview" : "View"}</span>
              <span>&rarr;</span>
            </span>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
}

export default ListingCard;
