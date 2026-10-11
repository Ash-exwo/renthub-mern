import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Container from "../../components/Container";
import { ListingCard, EmptyState } from "../../components/ui";

export default function WishlistPage() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem("renthub_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleRemove = (id) => {
    setFavorites((prev) => {
      const updated = prev.filter((item) => (item._id || item.id) !== id);
      try {
        localStorage.setItem("renthub_favorites", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="mb-8">
          <span className="text-xs font-bold text-[var(--color-terracotta)] uppercase tracking-wider">
            Saved Items
          </span>
          <h1 className="font-[var(--font-heading)] text-2xl sm:text-4xl font-extrabold text-[var(--color-espresso)] mt-1">
            My Wishlist ({favorites.length})
          </h1>
          <p className="text-sm text-[var(--color-muted-grey)] mt-1">
            Items and properties you've bookmarked for upcoming trips, productions, and projects.
          </p>
        </div>

        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Explore our catalog and click the heart icon on any rental to save it here for later."
            actionLabel="Explore Rentals"
            onAction={() => (window.location.href = "/explore")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((item) => (
              <ListingCard
                key={item._id || item.id}
                listing={item}
                isFavorite={true}
                onToggleFavorite={() => handleRemove(item._id || item.id)}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
