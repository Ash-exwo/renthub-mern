import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Images,
  AlertCircle,
  Calendar,
  CalendarDays,
  CalendarX,
  CreditCard,
  Star,
  MessageSquare,
  Flag,
  Percent,
  Tag,
} from "lucide-react";
import api from "../../utils/api";
import { isLoggedIn, getUser } from "../../utils/auth";
import {
  Button,
  Badge,
  StatusBadge,
  Rating,
  PriceDisplay,
  Modal,
} from "../../components/ui";
import Container from "../../components/Container";
import AvailabilityCalendarPicker from "../../components/AvailabilityCalendarPicker";
import RentHubCheckoutModal from "../../components/RentHubCheckoutModal";
import ReportListingModal from "../../components/ReportListingModal";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const today = startDate;
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [checkoutBookingId, setCheckoutBookingId] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchReviews() {
      setReviewsLoading(true);
      try {
        const res = await api.get(`/reviews/listing/${id}`);
        if (res.data) {
          setReviewsData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();

    const handleFocus = () => fetchReviews();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [id]);

  const images =
    listing?.images && listing.images.length > 0
      ? listing.images
      : [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80",
        ];

  const openLightbox = (index = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightboxImage();
      if (e.key === "ArrowLeft") prevLightboxImage();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await api.get(`/listings/${id}`);
        if (res.data?.listing) {
          setListing(res.data.listing);
          return;
        }
        setListing(null);
      } catch (err) {
        // Try fallback to list if user passed legacy or client ID
        try {
          const resAll = await api.get("/listings");
          const found = resAll.data?.listings?.find((item) => (item._id || item.id) === id);
          setListing(found || null);
        } catch {
          setListing(null);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  useEffect(() => {
    async function fetchBookedRanges() {
      try {
        const res = await api.get(`/bookings/listing/${id}/booked-dates`);
        if (res.data?.bookedRanges) {
          setBookedRanges(res.data.bookedRanges);
        }
      } catch {
        // ignore
      }
    }
    if (id) fetchBookedRanges();
  }, [id, bookingSuccess]);

  // Live Server Quote Engine (handles weekday/weekend differential, duration discounts, min/max limits)
  useEffect(() => {
    if (!id || !startDate || !endDate) return;
    let isCancelled = false;

    async function fetchQuote() {
      setQuoteLoading(true);
      setQuoteError("");
      try {
        const res = await api.post(`/listings/${id}/calculate-quote`, {
          startDate,
          endDate,
        });
        if (!isCancelled && res.data?.quote) {
          setQuoteData(res.data.quote);
        }
      } catch (err) {
        if (!isCancelled) {
          setQuoteError(err.response?.data?.message || "Invalid rental duration.");
        }
      } finally {
        if (!isCancelled) setQuoteLoading(false);
      }
    }

    fetchQuote();
    return () => {
      isCancelled = true;
    };
  }, [id, startDate, endDate]);

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center text-[var(--color-muted-grey)]">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold">Loading rental details...</p>
        </div>
      </Container>
    );
  }

  if (!listing) {
    return (
      <Container>
        <div className="py-20 text-center">
          <h2 className="text-2xl font-extrabold text-[var(--color-espresso)]">Listing not found</h2>
          <Link to="/explore">
            <Button variant="primary" className="mt-4">
              Back to Rentals
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  // Calculate duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end - start);
  const rentalDays = Number(quoteData?.rentalDays || quoteData?.days || Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));

  const dailyRate = Number(listing.rentalPricePerDay || 1500);
  const baseDailyPrice = Number(quoteData?.baseDailyPrice ?? quoteData?.dailyRate ?? dailyRate);
  const weekendPricePerDay = Number(quoteData?.weekendPricePerDay ?? quoteData?.weekendRate ?? (listing.weekendPricePerDay || dailyRate));
  const baseTotal = Number(quoteData ? (quoteData.grossAmount ?? quoteData.undiscountedBase ?? dailyRate * rentalDays) : dailyRate * rentalDays);
  const discountAmount = Number(quoteData?.discountAmount || 0);
  const discountPercentage = Number(quoteData?.appliedDiscountPercentage ?? quoteData?.discountPercentage ?? 0);
  const netRentalTotal = Number(quoteData ? (quoteData.rentalTotal ?? quoteData.basePrice ?? Math.max(0, baseTotal - discountAmount)) : Math.max(0, baseTotal - discountAmount));
  const securityDeposit = Number(quoteData?.deposit ?? (listing.deposit || Math.round(dailyRate * 1.5)));
  const serviceFee = Number(quoteData?.serviceFee ?? Math.round(netRentalTotal * 0.05));
  const grandTotal = Number(quoteData?.totalPrice ?? (netRentalTotal + securityDeposit + serviceFee));

  // Duration limit checks
  const minRentalDays = listing.minRentalDays || 1;
  const maxRentalDays = listing.maxRentalDays || 90;
  const durationLimitError =
    rentalDays < minRentalDays
      ? `Minimum rental period for this item is ${minRentalDays} day${minRentalDays > 1 ? "s" : ""}.`
      : rentalDays > maxRentalDays
      ? `Maximum allowable rental period is ${maxRentalDays} days.`
      : quoteError || "";

  // Live Overlap Detection: Checks if user's selected dates clash with any active reservation
  const dateConflict = (() => {
    if (!startDate || !endDate || bookedRanges.length === 0) return null;
    const reqStart = new Date(startDate);
    reqStart.setHours(0, 0, 0, 0);
    const reqEnd = new Date(endDate);
    reqEnd.setHours(0, 0, 0, 0);

    for (const range of bookedRanges) {
      const existStart = new Date(range.startDate);
      existStart.setHours(0, 0, 0, 0);
      const existEnd = new Date(range.endDate);
      existEnd.setHours(0, 0, 0, 0);

      // Overlap formula: existStart < reqEnd && existEnd > reqStart
      if (existStart < reqEnd && existEnd > reqStart) {
        return range;
      }
    }
    return null;
  })();

  const hostName =
    (typeof listing.owner === "object" && listing.owner?.name) ||
    listing.ownerName ||
    "Rental Host";
  const hostInitial = hostName.charAt(0).toUpperCase();

  const handleBookingSubmit = async () => {
    if (!loggedIn) {
      navigate("/login", {
        state: { from: `/listings/${id}`, notice: "Please log in to book this rental." },
      });
      return;
    }

    if (isOwner) {
      setBookingError("You cannot book your own listing.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const res = await api.post("/bookings", {
        listingId: id,
        startDate,
        endDate,
        notes: bookingNotes,
      });

      if (res.data?.booking) {
        setCreatedBooking(res.data.booking);
        setBookingSuccess(true);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to submit booking request. Please check dates and try again.";
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const categoryName =
    typeof listing.category === "object" && listing.category !== null
      ? listing.category.name
      : listing.category;
  const categoryIcon =
    typeof listing.category === "object" && listing.category !== null
      ? listing.category.icon
      : null;


  const user = getUser();
  const ownerId = typeof listing.owner === "object" ? listing.owner?._id : listing.owner;
  const isOwner = Boolean(user && ownerId && (user._id === ownerId || user.id === ownerId));

  return (
    <div className="py-6 pb-24">
      <Container>
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted-grey)] mb-5">
          <Link to="/" className="hover:text-[var(--color-brand-primary)]">Home</Link>
          <span>/</span>
          <Link to="/explore" className="hover:text-[var(--color-brand-primary)]">Rentals</Link>
          <span>/</span>
          <Link to={`/explore?category=${encodeURIComponent(categoryName || "")}`} className="hover:text-[var(--color-brand-primary)]">
            {categoryName}
          </Link>
          <span>/</span>
          <span className="text-[var(--color-espresso)] font-bold truncate max-w-xs">{listing.title}</span>
        </div>

        {/* High-res Image Gallery with E-Commerce Style Lightbox Trigger */}
        <div className="relative mb-8 select-none">
          {images.length === 1 ? (
            <div
              className="w-full h-72 md:h-[440px] rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm cursor-pointer group relative"
              onClick={() => openLightbox(0)}
            >
              <img
                src={images[0]}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(0);
                }}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 dark:bg-gray-900/90 dark:hover:bg-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>View Full Photo</span>
              </button>
            </div>
          ) : images.length === 2 ? (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-72 md:h-[440px] rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                <div
                  className="w-full h-full overflow-hidden bg-[var(--color-surface)] cursor-pointer group relative"
                  onClick={() => openLightbox(0)}
                >
                  <img
                    src={images[0]}
                    alt={`${listing.title} - photo 1`}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
                <div
                  className="w-full h-full overflow-hidden bg-[var(--color-surface)] cursor-pointer group relative"
                  onClick={() => openLightbox(1)}
                >
                  <img
                    src={images[1]}
                    alt={`${listing.title} - photo 2`}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 dark:bg-gray-900/90 dark:hover:bg-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                <Images className="w-3.5 h-3.5" />
                <span>View all 2 photos</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-72 md:h-[440px] rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                {/* Primary Cover Image (Takes 2 columns, static, opens index 0) */}
                <div
                  className="md:col-span-2 w-full h-full overflow-hidden bg-[var(--color-surface)] cursor-pointer group relative"
                  onClick={() => openLightbox(0)}
                >
                  <img
                    src={images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>

                {/* Right Column: Exactly 2 Equal Half-Height Stacked Thumbnails */}
                <div className="hidden md:flex flex-col gap-2 h-full min-h-0">
                  {/* Top-right thumbnail (Always image 1, opens index 1) */}
                  <div
                    className="flex-1 min-h-0 w-full overflow-hidden bg-[var(--color-surface)] cursor-pointer relative group"
                    onClick={() => openLightbox(1)}
                  >
                    <img
                      src={images[1]}
                      alt={`${listing.title} - photo 2`}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                  </div>

                  {/* Bottom-right thumbnail (Always image 2, opens index 2) */}
                  <div
                    className="flex-1 min-h-0 w-full overflow-hidden bg-[var(--color-surface)] cursor-pointer relative group"
                    onClick={() => openLightbox(2)}
                  >
                    <img
                      src={images[2]}
                      alt={`${listing.title} - photo 3`}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    {images.length > 3 && (
                      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-sm">
                        +{images.length - 3} photos
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View All Photos floating pill button */}
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 dark:bg-gray-900/90 dark:hover:bg-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                <Images className="w-3.5 h-3.5" />
                <span>View all {images.length} photos</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Content Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_23rem] gap-8 lg:gap-12 items-start">
          {/* Left Column: Details */}
          <div className="flex flex-col gap-6">
            {/* Header section */}
            <div>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1.5">
                  {categoryIcon && <span>{categoryIcon}</span>}
                  <span>{categoryName}</span>
                </span>
                <StatusBadge status={listing.availability || "available"} />
                {Boolean(listing.weekendPricePerDay && listing.weekendPricePerDay !== listing.rentalPricePerDay) && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 inline-flex items-center gap-1">
                    <span>Fri-Sun: ₹{Number(listing.weekendPricePerDay).toLocaleString("en-IN")}/day</span>
                  </span>
                )}
                {Boolean(listing.weeklyDiscountPercentage && listing.weeklyDiscountPercentage > 0) && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1">
                    <Percent size={12} />
                    <span>{listing.weeklyDiscountPercentage}% Off (7+ Days)</span>
                  </span>
                )}
                {Boolean(listing.monthlyDiscountPercentage && listing.monthlyDiscountPercentage > 0) && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 inline-flex items-center gap-1">
                    <Percent size={12} />
                    <span>{listing.monthlyDiscountPercentage}% Off (30+ Days)</span>
                  </span>
                )}
                {Boolean(listing.minRentalDays && listing.minRentalDays > 1) && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                    Min {listing.minRentalDays} days
                  </span>
                )}
                {isOwner && (
                  <Link to={`/listings/${id}/edit`} className="ml-auto">
                    <Button variant="outline" size="sm" icon={Pencil}>
                      Edit My Listing
                    </Button>
                  </Link>
                )}
              </div>

              <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-espresso)] my-3 tracking-tight">
                {listing.title}
              </h1>

              <div className="flex items-center gap-3 text-sm text-[var(--color-muted-grey)] flex-wrap">
                <div className="flex items-center gap-1 font-semibold">
                  <MapPin size={16} className="text-[var(--color-brand-primary)]" />
                  <span>{listing.location}</span>
                </div>
                <span>·</span>
                <Rating score={listing.rating || 4.9} reviewsCount={listing.reviewsCount || 18} />
              </div>
            </div>

            <div className="h-px bg-[var(--color-border-subtle)] w-full" />

            {/* Host info card */}
            <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white font-extrabold text-lg grid place-items-center shadow-md shrink-0">
                {hostInitial}
              </div>
              <div>
                <div className="font-extrabold text-base text-[var(--color-espresso)] flex items-center gap-2">
                  <span>Hosted by {hostName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Verified Host
                  </span>
                </div>
                <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                  100% On-Time Handover Record · Responds in &lt; 15 mins
                </div>
              </div>
            </div>

            <div className="h-px bg-[var(--color-border-subtle)] w-full" />

            {/* Description */}
            <div>
              <h2 className="text-xl font-extrabold text-[var(--color-espresso)] mb-2.5">About this rental</h2>
              <p className="text-sm text-[var(--color-secondary-text)] leading-relaxed">
                {listing.description ||
                  "Well maintained and ready for immediate rental. High performance specifications with reliable condition verified before handover."}
              </p>
            </div>

            <div className="h-px bg-[var(--color-border-subtle)] w-full" />

            {/* Amenities / What's Included */}
            <div>
              <h2 className="text-xl font-extrabold text-[var(--color-espresso)] mb-3">What is included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(listing.amenities || [
                  "Comprehensive Damage Coverage",
                  "24/7 Roadside & Tech Support",
                  "Original Accessories & Cables",
                  "Heavy-Duty Protective Case",
                  "Sanitized Before Handover",
                ]).map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-espresso)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--color-border-subtle)] w-full" />

            {/* Rental Rules */}
            <div>
              <h2 className="text-xl font-extrabold text-[var(--color-espresso)] mb-3">Rental Rules & Escrow Terms</h2>
              <ul className="list-disc list-inside text-sm text-[var(--color-secondary-text)] leading-relaxed space-y-1.5 font-medium">
                {(Array.isArray(listing.rules)
                  ? listing.rules
                  : typeof listing.rules === "string" && listing.rules.trim()
                  ? listing.rules.split("\n").filter(Boolean)
                  : [
                      "Digital government ID verification required at pickup/delivery",
                      "Return in original clean and operational working order",
                      "Extensions must be requested 12 hours before expiration via platform chat",
                      "Security deposit automatically refunded to source account upon safe return",
                    ]
                ).map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Pickup Location & Interactive Map */}
            {listing.coordinates?.lat && listing.coordinates?.lng && (
              <div className="flex flex-col gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-[var(--font-heading)] text-lg sm:text-xl font-bold text-[var(--color-espresso)] flex items-center gap-2">
                    <MapPin className="text-rose-500" size={20} />
                    <span>Pickup Location &amp; Map Area</span>
                  </h2>
                  <span className="text-xs font-semibold text-[var(--color-muted-grey)]">
                    {listing.location}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted-grey)]">
                  Exact item location and pickup point coordinates set by host.
                </p>
                <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] h-52 sm:h-64 w-full shadow-xs">
                  <iframe
                    title="Listing Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.coordinates.lng - 0.015}%2C${listing.coordinates.lat - 0.015}%2C${listing.coordinates.lng + 0.015}%2C${listing.coordinates.lat + 0.015}&layer=mapnik&marker=${listing.coordinates.lat}%2C${listing.coordinates.lng}`}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Interactive Availability Calendar Section */}
            <div
              className="flex flex-col gap-4 pt-4 border-t border-[var(--color-border-subtle)]"
              id="availability-calendar-section"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-[var(--font-heading)] text-lg sm:text-xl font-bold text-[var(--color-espresso)] flex items-center gap-2">
                    <CalendarDays className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <span>Availability &amp; Reservation Dates</span>
                  </h2>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Click an available start and end date to select your rental window. Booked and blackout days cannot be selected.
                  </p>
                </div>

                {rentalDays > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {rentalDays} {rentalDays === 1 ? "day" : "days"} selected
                  </span>
                )}
              </div>

              <AvailabilityCalendarPicker
                startDate={startDate}
                endDate={endDate}
                onChange={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                bookedRanges={bookedRanges}
                minDate={today}
              />
            </div>

            {/* Verified Reviews & Ratings Section */}
            <div
              className="flex flex-col gap-6 pt-6 border-t border-[var(--color-border-subtle)]"
              id="reviews-section"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Star size={20} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-[var(--font-heading)] text-lg sm:text-xl font-bold text-[var(--color-espresso)] flex items-center gap-2">
                      <span>Verified Reviews</span>
                      {reviewsData.totalReviews > 0 && (
                        <span className="text-sm font-extrabold text-[var(--color-brand-primary)]">
                          · {Number(reviewsData.averageRating || 0).toFixed(1)} ★
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-[var(--color-muted-grey)]">
                      {reviewsData.totalReviews === 0
                        ? "No verified reviews yet"
                        : `Based on ${reviewsData.totalReviews} verified rental${reviewsData.totalReviews === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>

                {reviewsData.totalReviews > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} /> 100% Verified Renters
                  </span>
                )}
              </div>

              {/* Star Breakdown Histogram */}
              {reviewsData.totalReviews > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] flex flex-col gap-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewsData.breakdown?.[stars] || 0;
                    const pct = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold text-[var(--color-espresso)] flex items-center gap-1">
                          <span>{stars}</span>
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[11px] text-[var(--color-muted-grey)]">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="py-8 text-center text-xs text-[var(--color-muted-grey)]">
                  Loading verified reviews...
                </div>
              ) : reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {reviewsData.reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {rev.reviewer?.avatar ? (
                              <img
                                src={rev.reviewer.avatar}
                                alt={rev.reviewer?.name || "Renter"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (rev.reviewer?.name || "R")[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--color-espresso)]">
                              {rev.reviewer?.name || "Verified Renter"}
                            </div>
                            <div className="text-[10px] text-[var(--color-muted-grey)]">
                              {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={
                                s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-transparent text-gray-300 dark:text-gray-700"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-[var(--color-secondary-text)] leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 px-4 rounded-2xl bg-[var(--color-surface-secondary)]/40 border border-dashed border-[var(--color-border)] text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Star size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-[var(--color-espresso)]">No Reviews Yet</h4>
                  <p className="text-xs text-[var(--color-muted-grey)] max-w-sm">
                    Be the first verified renter to complete a reservation and leave feedback for this listing!
                  </p>
                </div>
              )}
            </div>

            {/* Trust, Safety & Report Section */}
            {!isOwner && (
              <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-grey)]">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>RentHub Escrow &amp; Community Trust Protection Guarantee</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!loggedIn) {
                      navigate("/login", {
                        state: { from: `/listings/${id}`, notice: "Please log in to report this listing." },
                      });
                      return;
                    }
                    setReportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-muted-grey)] hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Flag size={14} />
                  <span>Report this listing</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Booking Card (Desktop) */}
          <aside className="hidden lg:block sticky top-24">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl flex flex-col gap-5 hover:border-[var(--color-brand-primary)]/30 transition-all">
              <div className="flex justify-between items-baseline">
                <PriceDisplay price={dailyRate} period="day" size="lg" />
                {reviewsData.totalReviews > 0 ? (
                  <Rating
                    score={reviewsData.averageRating}
                    reviewsCount={reviewsData.totalReviews}
                    showCount={true}
                  />
                ) : (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    ★ New
                  </span>
                )}
              </div>

              {/* Date pickers with calendar sync */}
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] flex items-center gap-1">
                    <CalendarDays size={12} className="text-indigo-600" />
                    <span>Select Rental Dates</span>
                  </span>
                  <a
                    href="#availability-calendar-section"
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Calendar &darr;
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]">
                      From Date
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]">
                      To Date
                    </label>
                    <input
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>
                </div>
              </div>

              {/* Date Conflict Warning Banner */}
              {dateConflict && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <div className="font-bold">Dates Already Reserved</div>
                    <div className="font-normal text-[11px] mt-0.5 text-amber-700 dark:text-amber-400 leading-snug">
                      This item is booked from{" "}
                      <strong>
                        {new Date(dateConflict.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </strong>{" "}
                      to{" "}
                      <strong>
                        {new Date(dateConflict.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </strong>
                      . Please pick alternative dates.
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Booked Dates Preview */}
              {bookedRanges.length > 0 && !dateConflict && (
                <div className="text-[11px] text-[var(--color-muted-grey)]">
                  <span className="font-bold text-[var(--color-espresso)]">Reserved Dates: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {bookedRanges.map((r, i) => (
                      <span
                        key={i}
                        className="inline-block bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20"
                      >
                        {new Date(r.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        &rarr;{" "}
                        {new Date(r.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration Limit Warning Banner */}
              {durationLimitError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <div className="font-bold">Rental Duration Notice</div>
                    <div className="font-normal text-[11px] mt-0.5">{durationLimitError}</div>
                  </div>
                </div>
              )}

              {/* Transparent Price Breakdown */}
              <div className="flex flex-col gap-2.5 py-4 border-y border-[var(--color-border-subtle)] text-xs">
                {quoteData && quoteData.weekendDays > 0 ? (
                  <>
                    <div className="flex justify-between text-[var(--color-secondary-text)]">
                      <span>{quoteData.weekdayDays} Weekday{quoteData.weekdayDays !== 1 ? "s" : ""} × ₹{baseDailyPrice.toLocaleString("en-IN")}</span>
                      <span className="font-semibold text-[var(--color-espresso)]">
                        ₹{(quoteData.weekdayDays * baseDailyPrice).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[var(--color-secondary-text)]">
                      <span>{quoteData.weekendDays} Weekend Day{quoteData.weekendDays !== 1 ? "s" : ""} × ₹{weekendPricePerDay.toLocaleString("en-IN")}</span>
                      <span className="font-semibold text-[var(--color-espresso)]">
                        ₹{(quoteData.weekendDays * weekendPricePerDay).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-[var(--color-secondary-text)]">
                    <span>₹{dailyRate.toLocaleString("en-IN")} × {rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
                    <span className="font-semibold text-[var(--color-espresso)]">₹{baseTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Percent size={12} />
                      <span>{quoteData?.appliedDiscountType === "monthly" ? "Monthly" : "Weekly"} Discount ({discountPercentage}%)</span>
                    </span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-[var(--color-secondary-text)]">
                  <span className="flex items-center gap-1">
                    <span>Security Deposit</span>
                    <span className="text-[10px] text-emerald-600 font-bold">(refundable)</span>
                  </span>
                  <span className="font-semibold text-emerald-600">₹{securityDeposit.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-[var(--color-secondary-text)]">
                  <span>Protection & Escrow fee</span>
                  <span className="font-semibold text-[var(--color-espresso)]">₹{serviceFee.toLocaleString("en-IN")}</span>
                </div>

                <div className="pt-2 border-t border-[var(--color-border-subtle)] font-extrabold text-base text-[var(--color-espresso)] flex justify-between">
                  <span>Total Amount</span>
                  <span className="text-[var(--color-brand-primary)]">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {isOwner ? (
                <Link to={`/listings/${id}/edit`}>
                  <Button variant="outline" size="lg" fullWidth icon={Pencil}>
                    You Own This Listing · Edit
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={Boolean(dateConflict || durationLimitError)}
                    onClick={() => {
                      if (!loggedIn) {
                        navigate("/login", {
                          state: { from: `/listings/${id}`, notice: "Please log in to reserve this rental." },
                        });
                        return;
                      }
                      setBookingModalOpen(true);
                    }}
                  >
                    {!loggedIn
                      ? "Sign In to Reserve"
                      : dateConflict
                      ? "Selected Dates Unavailable"
                      : durationLimitError
                      ? "Adjust Rental Duration"
                      : "Reserve Rental"}
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    icon={MessageSquare}
                    onClick={() => {
                      if (!loggedIn) {
                        navigate("/login", {
                          state: { from: `/listings/${id}`, notice: "Please log in to chat with the host." },
                        });
                        return;
                      }
                      navigate(`/messages?listingId=${id}&ownerId=${ownerId}&tab=renting`);
                    }}
                  >
                    Chat with Host
                  </Button>
                </div>
              )}

              <div className="text-center text-[11px] text-[var(--color-muted-grey)]">
                {isOwner
                  ? "This is your listing. Switch to Owner mode to manage availability."
                  : dateConflict
                  ? "Select dates outside of the reserved ranges to book."
                  : "You won't be charged yet. Host confirms in < 2 hours."}
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]/95 backdrop-blur-xl border-t border-[var(--color-border)] px-5 py-3.5 flex items-center justify-between z-40 shadow-2xl">
        <button
          type="button"
          onClick={() => setMobileCalendarOpen(true)}
          className="text-left group cursor-pointer"
        >
          <PriceDisplay price={dailyRate} period="day" size="md" />
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 group-hover:underline">
            <CalendarDays size={12} />
            <span>{rentalDays} day{rentalDays !== 1 ? "s" : ""} · Change dates</span>
          </div>
        </button>

        {isOwner ? (
          <Link to={`/listings/${id}/edit`}>
            <Button variant="outline" size="md" icon={Pencil}>
              Edit Listing
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={MessageSquare}
              onClick={() => {
                if (!loggedIn) {
                  navigate("/login", {
                    state: { from: `/listings/${id}`, notice: "Please log in to chat with the host." },
                  });
                  return;
                }
                navigate(`/messages?listingId=${id}&ownerId=${ownerId}&tab=renting`);
              }}
            >
              Chat
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={Boolean(dateConflict || durationLimitError)}
              onClick={() => {
                if (!loggedIn) {
                  navigate("/login", {
                    state: { from: `/listings/${id}`, notice: "Please log in to reserve this rental." },
                  });
                  return;
                }
                setBookingModalOpen(true);
              }}
            >
              {!loggedIn ? "Sign In to Rent" : dateConflict ? "Unavailable" : "Reserve"}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Availability Calendar Modal */}
      <Modal
        isOpen={mobileCalendarOpen}
        onClose={() => setMobileCalendarOpen(false)}
        title="Select Rental Dates"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-muted-grey)]">
            Tap an available start and end date to select your rental window:
          </p>
          <AvailabilityCalendarPicker
            startDate={startDate}
            endDate={endDate}
            onChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
            bookedRanges={bookedRanges}
            minDate={today}
          />
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMobileCalendarOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Booking Checkout & Confirmation Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setBookingSuccess(false);
          setBookingError("");
        }}
        title={bookingSuccess ? "Booking Request Submitted!" : "Review & Request Rental"}
      >
        {bookingSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-[var(--color-espresso)] mb-1">
              Request Sent to Host!
            </h3>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-3">
              Status: Awaiting Owner Approval
            </div>

            <p className="text-sm text-[var(--color-secondary-text)] leading-relaxed mb-6">
              Host <strong>{hostName}</strong> has received your reservation request for{" "}
              <strong>{listing.title}</strong>. You will be notified as soon as they accept!
            </p>

            <div className="bg-[var(--color-surface-secondary)] p-4 rounded-xl text-xs space-y-2 mb-6 text-left border border-[var(--color-border-subtle)]">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Booking Ref:</span>
                <span className="font-mono font-bold text-[var(--color-espresso)]">
                  {createdBooking?._id || "REF-SUBMITTED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Requested Dates:</span>
                <span className="font-semibold text-[var(--color-espresso)]">
                  {startDate} to {endDate} ({rentalDays} {rentalDays === 1 ? "day" : "days"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Total Estimated:</span>
                <span className="font-extrabold text-[var(--color-brand-primary)]">
                  ₹{(createdBooking?.totalPrice || grandTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 justify-center flex-wrap">
              <Button
                variant="primary"
                icon={CreditCard}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={() => {
                  const bId = createdBooking?._id;
                  setBookingModalOpen(false);
                  setCheckoutBookingId(bId);
                }}
              >
                Pay & Secure Escrow
              </Button>
              <Link to="/bookings">
                <Button variant="secondary">View In My Rentals</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setBookingModalOpen(false);
                  setBookingSuccess(false);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <img
                src={images[0]}
                alt={listing.title}
                className="w-16 h-16 object-cover rounded-xl shrink-0"
              />
              <div>
                <h4 className="font-extrabold text-sm text-[var(--color-espresso)] mb-1">
                  {listing.title}
                </h4>
                <div className="text-xs text-[var(--color-muted-grey)]">{listing.location}</div>
              </div>
            </div>

            {/* Error banner if dates conflict or validation fails */}
            {bookingError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold leading-relaxed">
                {bookingError}
              </div>
            )}

            <div className="bg-[var(--color-surface-secondary)] p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Dates:</span>
                <span className="font-semibold text-[var(--color-espresso)]">
                  {startDate} to {endDate} ({rentalDays} {rentalDays === 1 ? "day" : "days"})
                </span>
              </div>
              {quoteData && quoteData.weekendDays > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-grey)]">Weekdays ({quoteData.weekdayDays}d):</span>
                    <span className="font-semibold text-[var(--color-espresso)]">
                      ₹{(quoteData.weekdayDays * baseDailyPrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-grey)]">Weekends ({quoteData.weekendDays}d):</span>
                    <span className="font-semibold text-[var(--color-espresso)]">
                      ₹{(quoteData.weekendDays * weekendPricePerDay).toLocaleString("en-IN")}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted-grey)]">Daily Rate:</span>
                  <span className="font-semibold text-[var(--color-espresso)]">
                    ₹{dailyRate.toLocaleString("en-IN")} /day × {rentalDays} = ₹{baseTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Percent size={12} />
                    <span>{quoteData?.appliedDiscountType === "monthly" ? "Monthly" : "Weekly"} Discount ({discountPercentage}%):</span>
                  </span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Security Deposit:</span>
                <span className="font-semibold text-emerald-600">
                  ₹{securityDeposit.toLocaleString("en-IN")} (Refundable)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Service Fee:</span>
                <span className="font-semibold text-[var(--color-espresso)]">
                  ₹{serviceFee.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Optional note for host */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
                Message to Host (Optional)
              </label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Share your planned rental purpose or pickup coordination..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                maxLength={500}
              />
            </div>

            <div className="flex justify-between items-baseline border-t border-[var(--color-border-subtle)] pt-3">
              <span className="font-semibold text-sm text-[var(--color-espresso)]">Total Due</span>
              <span className="font-extrabold text-xl text-[var(--color-brand-primary)]">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                fullWidth
                disabled={bookingLoading}
                onClick={() => {
                  setBookingModalOpen(false);
                  setBookingError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={bookingLoading}
                onClick={handleBookingSubmit}
              >
                Request Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Full-Screen E-Commerce Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen photo gallery"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Top Bar: Title, Count, Close Button */}
          <div
            className="w-full px-6 py-4 flex items-center justify-between text-white border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md text-white/90">
                {lightboxIndex + 1} / {images.length}
              </span>
              <h3 className="text-sm font-semibold text-white/90 truncate max-w-xs md:max-w-md">
                {listing.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close full photo view"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Stage: Previous / Main Image / Next */}
          <div
            className="relative flex-1 flex items-center justify-center px-4 md:px-16 py-4 overflow-hidden min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={prevLightboxImage}
                aria-label="Previous photo"
                className="absolute left-4 md:left-6 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main Full-Size Image (Uncropped E-commerce presentation) */}
            <img
              src={images[lightboxIndex]}
              alt={`${listing.title} - photo ${lightboxIndex + 1}`}
              className="max-h-[72vh] md:max-h-[76vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
            />

            {/* Next button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={nextLightboxImage}
                aria-label="Next photo"
                className="absolute right-4 md:right-6 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnail Strip */}
          {images.length > 1 && (
            <div
              className="w-full py-3.5 px-6 border-t border-white/10 flex items-center justify-center gap-3 overflow-x-auto shrink-0 bg-black/40"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer ${
                    lightboxIndex === idx
                      ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-black opacity-100 scale-105"
                      : "opacity-45 hover:opacity-85"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive RentHub Escrow Checkout Modal */}
      <RentHubCheckoutModal
        isOpen={Boolean(checkoutBookingId)}
        onClose={() => setCheckoutBookingId(null)}
        bookingId={checkoutBookingId}
        onSuccess={() => {
          navigate("/bookings");
        }}
      />

      {/* Trust & Safety Report Modal */}
      <ReportListingModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        listingId={id}
        listingTitle={listing?.title || "Item"}
      />
    </div>
  );
}
