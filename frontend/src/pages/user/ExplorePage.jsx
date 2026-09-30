import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  Sparkles,
} from "lucide-react";
import api from "../../utils/api";
import { FEATURED_LISTINGS, POPULAR_CATEGORIES } from "../../utils/mockData";
import {
  Input,
  Button,
  ListingCard,
  Drawer,
  EmptyState,
  ListingCardSkeleton,
} from "../../components/ui";
import Container from "../../components/Container";

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Highest Rated" },
];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Filter states initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("location") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || 15000);
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || 0);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    async function loadListings() {
      try {
        const res = await api.get("/listings");
        if (res.data?.listings && res.data.listings.length > 0) {
          const apiListings = res.data.listings.map((item) => ({
            ...item,
            rating: item.rating || 4.9,
            reviewsCount: item.reviewsCount || 16,
          }));
          setListings([...apiListings, ...FEATURED_LISTINGS]);
        } else {
          setListings(FEATURED_LISTINGS);
        }
      } catch (err) {
        setListings(FEATURED_LISTINGS);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  // Sync category from URL if changed from navbar or home
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat !== null && cat !== selectedCategory) {
      setSelectedCategory(cat);
    }
    const loc = searchParams.get("location");
    if (loc !== null && loc !== selectedLocation) {
      setSelectedLocation(loc);
    }
  }, [searchParams]);

  // Filter & sort logic
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchCat = item.category?.toLowerCase().includes(q);
          const matchLoc = item.location?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat && !matchLoc) return false;
        }

        // Category
        if (selectedCategory) {
          if (item.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        // Location
        if (selectedLocation.trim()) {
          const loc = selectedLocation.toLowerCase();
          if (!item.location?.toLowerCase().includes(loc)) {
            return false;
          }
        }

        // Price
        const price = Number(item.rentalPricePerDay || 0);
        if (price > Number(maxPrice)) {
          return false;
        }

        // Rating
        const rating = Number(item.rating || 0);
        if (rating < Number(minRating)) {
          return false;
        }

        // Availability
        if (availabilityOnly) {
          if (item.availability !== "available") {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") {
          return Number(a.rentalPricePerDay || 0) - Number(b.rentalPricePerDay || 0);
        }
        if (sortBy === "price-desc") {
          return Number(b.rentalPricePerDay || 0) - Number(a.rentalPricePerDay || 0);
        }
        if (sortBy === "rating-desc") {
          return Number(b.rating || 0) - Number(a.rating || 0);
        }
        return 0; // recommended
      });
  }, [listings, searchQuery, selectedCategory, selectedLocation, maxPrice, minRating, availabilityOnly, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLocation("");
    setMaxPrice(15000);
    setMinRating(0);
    setAvailabilityOnly(false);
    setSortBy("recommended");
    setSearchParams({});
  };

  // Reusable Filter Controls JSX (used in desktop sidebar & mobile drawer)
  const renderFilterControls = () => (
    <div className="flex flex-col gap-5">
      {/* Search Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[var(--color-espresso)] uppercase tracking-wider">Keyword Search</label>
        <Input
          placeholder="Camera, apartment, tent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefixIcon={Search}
        />
      </div>

      {/* Location Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[var(--color-espresso)] uppercase tracking-wider">Location / City</label>
        <Input
          placeholder="Kochi, Bangalore..."
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          prefixIcon={MapPin}
        />
      </div>

      {/* Max Price Range */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-[var(--color-espresso)] uppercase tracking-wider">Max Price / Day</label>
          <span className="font-extrabold text-xs text-[var(--color-brand-primary)]">
            ₹{Number(maxPrice).toLocaleString("en-IN")}
          </span>
        </div>
        <input
          type="range"
          min="500"
          max="25000"
          step="500"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full accent-[var(--color-brand-primary)] cursor-pointer"
        />
      </div>

      {/* Minimum Rating */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[var(--color-espresso)] uppercase tracking-wider">Customer Rating</label>
        <div className="flex flex-col gap-1.5">
          {[
            { val: 0, label: "Any rating" },
            { val: 4.5, label: "4.5★ & above" },
            { val: 4.8, label: "4.8★ & above" },
          ].map((r) => (
            <label
              key={r.val}
              className="flex items-center gap-2 text-xs font-medium cursor-pointer text-[var(--color-espresso)]"
            >
              <input
                type="radio"
                name="rating"
                checked={Number(minRating) === r.val}
                onChange={() => setMinRating(r.val)}
                className="accent-[var(--color-brand-primary)]"
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Only */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-[var(--color-espresso)]">
          <input
            type="checkbox"
            checked={availabilityOnly}
            onChange={(e) => setAvailabilityOnly(e.target.checked)}
            className="accent-[var(--color-brand-primary)]"
          />
          <span>Show available items only</span>
        </label>
      </div>

      {/* Clear Filters Button */}
      <Button
        variant="outline"
        size="sm"
        fullWidth
        icon={RotateCcw}
        onClick={handleResetFilters}
      >
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="py-6 sm:py-10 pb-20 flex flex-col gap-6">
      <Container>
        {/* Header Title */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)] mb-1">
                Marketplace Index
              </div>
              <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-espresso)]">
                Explore Rental Catalog
              </h1>
              <p className="text-sm text-[var(--color-muted-grey)] mt-1">
                Compare verified properties, cinema cameras, drones, EVs, and precision equipment.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={SlidersHorizontal}
              className="md:hidden"
              onClick={() => setMobileDrawerOpen(true)}
            >
              Filters
            </Button>
          </div>

          {/* Sleek Category Pills Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 ${
                selectedCategory === ""
                  ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-sm shadow-rose-500/20"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-subtle)]"
              }`}
              onClick={() => setSelectedCategory("")}
            >
              All Rentals
            </button>
            {POPULAR_CATEGORIES.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 ${
                    active
                      ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-sm shadow-rose-500/20"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-subtle)]"
                  }`}
                  onClick={() => setSelectedCategory(active ? "" : cat.name)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Layout Split */}
        <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] lg:grid-cols-[18rem_1fr] gap-8 items-start mt-4">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:flex flex-col gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sticky top-24 shadow-sm hover:border-[var(--color-brand-primary)]/20 transition-all">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border-subtle)]">
              <span className="font-extrabold text-sm text-[var(--color-espresso)]">Filter Search</span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[var(--color-muted-grey)] hover:text-[var(--color-brand-primary)] cursor-pointer"
              >
                Clear all
              </button>
            </div>
            {renderFilterControls()}
          </aside>

          {/* Results Area */}
          <main>
            {/* Toolbar: Counter & Sort */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b border-[var(--color-border-subtle)]">
              <div className="text-sm text-[var(--color-muted-grey)]">
                Showing <strong className="text-[var(--color-espresso)]">{filteredListings.length}</strong> rental{filteredListings.length !== 1 ? "s" : ""}
                {selectedCategory && <span> in <em className="text-[var(--color-espresso)] font-bold not-italic">{selectedCategory}</em></span>}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-muted-grey)] font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Display: Loading / Empty / Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No rentals match your criteria"
                description="Try loosening your price range, choosing a broader location, or clearing categories."
                actionLabel="Reset All Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((item) => (
                  <ListingCard key={item._id || item.id} listing={item} />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title="Filter Rentals"
          footer={
            <div className="flex items-center gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => {
                  handleResetFilters();
                  setMobileDrawerOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setMobileDrawerOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          }
        >
          {renderFilterControls()}
        </Drawer>
      </Container>
    </div>
  );
}
