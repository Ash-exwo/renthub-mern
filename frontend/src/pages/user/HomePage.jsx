import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Grid,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Compass,
  Lock,
  Layers,
  Award,
} from "lucide-react";
import api from "../../utils/api";
import { POPULAR_CATEGORIES, FEATURED_LISTINGS } from "../../utils/mockData";
import { Button, ListingCard } from "../../components/ui";
import Container from "../../components/Container";

export default function HomePage() {
  const navigate = useNavigate();

  const [listings, setListings] = useState(FEATURED_LISTINGS);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchDuration, setSearchDuration] = useState("");

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await api.get("/listings");
        if (res.data?.listings && res.data.listings.length > 0) {
          const apiListings = res.data.listings.map((item) => ({
            ...item,
            rating: item.rating || 4.9,
            reviewsCount: item.reviewsCount || 14,
          }));
          setListings([...apiListings, ...FEATURED_LISTINGS]);
        }
      } catch (err) {
        setListings(FEATURED_LISTINGS);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.append("location", searchLocation.trim());
    if (searchCategory.trim()) params.append("category", searchCategory.trim());
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-12 sm:gap-16 lg:gap-24 pb-20">
      {/* Clean Modern Hero Section */}
      <section className="ambient-glow-wrapper text-center pt-6 sm:pt-10 lg:pt-14 pb-6 flex flex-col items-center relative">
        <Container>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 mb-6 shadow-sm">
            <Sparkles size={14} className="text-[var(--color-brand-primary)]" />
            <span>Trusted Peer-to-Peer Rental Marketplace</span>
          </div>

          {/* Heading */}
          <h1 className="font-[var(--font-heading)] text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-espresso)] leading-[1.15] mb-5 max-w-4xl mx-auto tracking-tight">
            The modern way to rent{" "}
            <span className="bg-gradient-to-r from-[var(--color-brand-primary)] via-rose-500 to-amber-500 bg-clip-text text-transparent inline-block">
              spaces, tech & gear
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[var(--color-secondary-text)] max-w-2xl mx-auto mb-9 leading-relaxed">
            Discover thousands of verified apartments, cinema cameras, drones, EVs, and precision equipment with instant escrow guarantees and ₹1,00,000 damage coverage.
          </p>

          {/* Segmented Elevated Search Capsule */}
          <form
            className="w-full max-w-4xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl md:rounded-full p-2.5 md:p-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-stretch md:items-center gap-2 focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-rose-500/20 transition-all text-left"
            onSubmit={handleSearch}
          >
            {/* Field 1: Location */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
              <MapPin size={18} className="text-[var(--color-brand-primary)] shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <label htmlFor="home-search-location" className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]">
                  Where
                </label>
                <input
                  id="home-search-location"
                  type="text"
                  placeholder="e.g. Kochi, Bangalore"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full bg-transparent border-none text-sm font-semibold text-[var(--color-espresso)] placeholder-[var(--color-muted-grey)] focus:outline-none"
                />
              </div>
            </div>

            {/* Field 2: Category */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
              <Grid size={18} className="text-[var(--color-brand-primary)] shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <label htmlFor="home-search-category" className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]">
                  Category
                </label>
                <select
                  id="home-search-category"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full bg-transparent border-none text-sm font-semibold text-[var(--color-espresso)] focus:outline-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {POPULAR_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field 3: Duration */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <Calendar size={18} className="text-[var(--color-brand-primary)] shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <label htmlFor="home-search-duration" className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]">
                  Period
                </label>
                <select
                  id="home-search-duration"
                  value={searchDuration}
                  onChange={(e) => setSearchDuration(e.target.value)}
                  className="w-full bg-transparent border-none text-sm font-semibold text-[var(--color-espresso)] focus:outline-none cursor-pointer"
                >
                  <option value="">Any Duration</option>
                  <option value="daily">Daily Rental</option>
                  <option value="weekly">Weekly (7+ days)</option>
                  <option value="monthly">Monthly (30+ days)</option>
                </select>
              </div>
            </div>

            {/* Search Submit CTA */}
            <Button type="submit" variant="primary" size="lg" icon={Search} className="rounded-full shrink-0">
              Search Rentals
            </Button>
          </form>

          {/* Floating Trust Metrics Chips */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap mt-8 text-xs font-semibold text-[var(--color-secondary-text)]">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>₹1,00,000 Damage Protection</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <Lock size={16} className="text-[var(--color-brand-primary)]" />
              <span>100% Escrow Protected</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <Award size={16} className="text-amber-500" />
              <span>Instant Verification</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Popular Categories Grid */}
      <section>
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)] mb-1">
                Explore The Marketplace
              </div>
              <h2 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)]">
                Browse by Category
              </h2>
            </div>
            <Link to="/explore" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1">
              <span>View all categories</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/explore?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center justify-center text-center p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/30 transition-all duration-200">
                  {cat.icon}
                </div>
                <span className="font-[var(--font-heading)] font-bold text-xs text-[var(--color-espresso)] group-hover:text-[var(--color-brand-primary)] transition-colors line-clamp-1">
                  {cat.name}
                </span>
                <span className="text-[11px] text-[var(--color-muted-grey)] mt-0.5">{cat.count} items</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Listings */}
      <section>
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[var(--color-brand-primary)] font-bold text-xs uppercase tracking-wider">
                <TrendingUp size={14} />
                <span>Verified High-Demand Assets</span>
              </div>
              <h2 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)] mt-1">
                Featured Rentals
              </h2>
            </div>

            <Link to="/explore">
              <Button variant="outline" size="sm" icon={Compass}>
                Explore Full Catalog
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {listings.slice(0, 6).map((item) => (
              <ListingCard key={item._id || item.id} listing={item} />
            ))}
          </div>
        </Container>
      </section>

      {/* Modern 3-Step "How RentHub Works" */}
      <section className="bg-[var(--color-surface-subtle)] py-14 sm:py-20 border-y border-[var(--color-border)] relative">
        <Container>
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)] mb-2">
              Simple & Transparent
            </div>
            <h2 className="font-[var(--font-heading)] text-2xl sm:text-4xl font-extrabold text-[var(--color-espresso)]">
              How RentHub Works
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-muted-grey)] mt-2">
              Experience seamless renting backed by smart escrow deposits and instant identity verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-sm hover:border-[var(--color-brand-primary)]/40 hover:shadow-md transition-all flex flex-col relative group">
              <div className="font-[var(--font-heading)] text-3xl sm:text-4xl font-black text-[var(--color-brand-primary)] mb-3 opacity-90">
                01
              </div>
              <h3 className="font-[var(--font-heading)] font-extrabold text-lg text-[var(--color-espresso)] mb-2">
                Discover & Select Dates
              </h3>
              <p className="text-sm text-[var(--color-muted-grey)] leading-relaxed">
                Filter verified camera gear, vehicles, electronics, or properties. Inspect specs, transparent daily pricing, and owner ratings.
              </p>
            </div>

            <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-sm hover:border-[var(--color-brand-primary)]/40 hover:shadow-md transition-all flex flex-col relative group">
              <div className="font-[var(--font-heading)] text-3xl sm:text-4xl font-black text-[var(--color-brand-primary)] mb-3 opacity-90">
                02
              </div>
              <h3 className="font-[var(--font-heading)] font-extrabold text-lg text-[var(--color-espresso)] mb-2">
                Escrow Protected Reserve
              </h3>
              <p className="text-sm text-[var(--color-muted-grey)] leading-relaxed">
                Book instantly with digital escrow. Your refundable security deposit remains protected until the item is safely returned.
              </p>
            </div>

            <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-sm hover:border-[var(--color-brand-primary)]/40 hover:shadow-md transition-all flex flex-col relative group">
              <div className="font-[var(--font-heading)] text-3xl sm:text-4xl font-black text-[var(--color-brand-primary)] mb-3 opacity-90">
                03
              </div>
              <h3 className="font-[var(--font-heading)] font-extrabold text-lg text-[var(--color-espresso)] mb-2">
                Pickup, Use & Return
              </h3>
              <p className="text-sm text-[var(--color-muted-grey)] leading-relaxed">
                Coordinate pickup with your verified host. Enjoy your rental, return it, and your security deposit unlocks automatically.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Trust & Safety Guarantees */}
      <section>
        <Container>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-5 shadow-sm">
                <ShieldCheck size={26} />
              </div>
              <h3 className="text-lg font-extrabold text-[var(--color-espresso)] mb-2">
                ₹1,00,000 Damage Coverage
              </h3>
              <p className="text-sm text-[var(--color-muted-grey)] leading-relaxed">
                Every rental on RentHub carries built-in damage coverage to protect hosts and renters from accidental mishaps.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-[var(--color-brand-primary)] grid place-items-center mb-5 shadow-sm">
                <Zap size={26} />
              </div>
              <h3 className="text-lg font-extrabold text-[var(--color-espresso)] mb-2">
                Instant Escrow Checkout
              </h3>
              <p className="text-sm text-[var(--color-muted-grey)] leading-relaxed">
                Funds are held in secure escrow and only disbursed to hosts after you inspect and accept the asset.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid place-items-center mb-5 shadow-sm">
                <Sparkles size={26} />
              </div>
              <h3 className="text-lg font-extrabold text-[var(--color-espresso)] mb-2">
                100% Verified Community
              </h3>
              <p className="text-sm text-[var(--color-muted-grey)] leading-relaxed">
                Every host and renter undergoes mandatory ID checks. Verified reviews prevent fabricated listings.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Host Monetization Banner */}
      <section>
        <Container>
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center shadow-xl relative overflow-hidden border border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[var(--color-brand-primary)] font-bold text-xs uppercase tracking-wider mb-3">
                <Zap size={15} />
                <span>Monetize Idle Inventory</span>
              </div>
              <h2 className="font-[var(--font-heading)] text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                Turn your equipment, gear or spaces into recurring revenue
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed max-w-xl">
                List in minutes, set custom daily or weekly rates, and keep 95% of every transaction with automated escrow and damage coverage.
              </p>

              <Link to="/listings/new">
                <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                  Start Listing Today
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-rose-400 tracking-tight">₹32,000/mo</div>
                <div className="text-xs text-slate-300 mt-1">Average monthly earnings for camera, drone & lens owners</div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">Zero Risk Escrow</div>
                <div className="text-xs text-slate-300 mt-1">Every booking backed by deposit security and automated damage insurance.</div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
