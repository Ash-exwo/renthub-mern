import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import api from "../../utils/api";
import { FEATURED_LISTINGS } from "../../utils/mockData";
import { isLoggedIn } from "../../utils/auth";
import {
  Button,
  Badge,
  StatusBadge,
  Rating,
  PriceDisplay,
  Modal,
} from "../../components/ui";
import Container from "../../components/Container";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await api.get("/listings");
        const found =
          res.data?.listings?.find((item) => item._id === id || item.id === id) ||
          FEATURED_LISTINGS.find((item) => item._id === id || item.id === id);

        if (found) {
          setListing(found);
        } else {
          setListing(FEATURED_LISTINGS[0]);
        }
      } catch (err) {
        const foundMock = FEATURED_LISTINGS.find((item) => item._id === id || item.id === id);
        setListing(foundMock || FEATURED_LISTINGS[0]);
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

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
              Back to Catalog
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
  const rentalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const dailyRate = Number(listing.rentalPricePerDay || 1500);
  const baseTotal = dailyRate * rentalDays;
  const securityDeposit = listing.deposit || Math.round(dailyRate * 1.5);
  const serviceFee = Math.round(baseTotal * 0.05);
  const grandTotal = baseTotal + securityDeposit + serviceFee;

  const handleBookingSubmit = () => {
    if (!loggedIn) {
      navigate("/login", {
        state: { from: `/listings/${id}`, notice: "Please log in to book this rental." },
      });
      return;
    }
    setBookingSuccess(true);
  };

  const images = listing.images && listing.images.length > 0 ? listing.images : [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80"
  ];

  return (
    <div className="py-6 pb-24">
      <Container>
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted-grey)] mb-5">
          <Link to="/" className="hover:text-[var(--color-brand-primary)]">Home</Link>
          <span>/</span>
          <Link to="/explore" className="hover:text-[var(--color-brand-primary)]">Catalog</Link>
          <span>/</span>
          <Link to={`/explore?category=${listing.category}`} className="hover:text-[var(--color-brand-primary)]">{listing.category}</Link>
          <span>/</span>
          <span className="text-[var(--color-espresso)] font-bold truncate max-w-xs">{listing.title}</span>
        </div>

        {/* High-res Image Gallery Mosaic with Modern Curved Corners */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 h-72 md:h-[440px] rounded-3xl overflow-hidden mb-8 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] shadow-md">
          <img src={images[0]} alt={listing.title} className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" />
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <img
              src={images[1] || images[0]}
              alt="Thumbnail 1"
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
            />
            <img
              src={images[2] || images[0]}
              alt="Thumbnail 2"
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
            />
          </div>
        </div>

        {/* Main Content Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_23rem] gap-8 lg:gap-12 items-start">
          {/* Left Column: Details */}
          <div className="flex flex-col gap-6">
            {/* Header section */}
            <div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {listing.category}
                </span>
                <StatusBadge status={listing.availability || "available"} />
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
                {(listing.ownerName || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-extrabold text-base text-[var(--color-espresso)] flex items-center gap-2">
                  <span>Hosted by {listing.ownerName || "Aswathy V"}</span>
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
                {(listing.rules || [
                  "Digital government ID verification required at pickup/delivery",
                  "Return in original clean and operational working order",
                  "Extensions must be requested 12 hours before expiration via platform chat",
                  "Security deposit automatically refunded to source account upon safe return",
                ]).map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Sticky Booking Card (Desktop) */}
          <aside className="hidden lg:block sticky top-24">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl flex flex-col gap-5 hover:border-[var(--color-brand-primary)]/30 transition-all">
              <div className="flex justify-between items-baseline">
                <PriceDisplay price={dailyRate} period="day" size="lg" />
                <Rating score={listing.rating || 4.9} showCount={false} />
              </div>

              {/* Date pickers */}
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
                    className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
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
                    className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
              </div>

              {/* Transparent Price Breakdown */}
              <div className="flex flex-col gap-2.5 py-4 border-y border-[var(--color-border-subtle)] text-xs">
                <div className="flex justify-between text-[var(--color-secondary-text)]">
                  <span>₹{dailyRate.toLocaleString("en-IN")} × {rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
                  <span className="font-semibold text-[var(--color-espresso)]">₹{baseTotal.toLocaleString("en-IN")}</span>
                </div>

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

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setBookingModalOpen(true)}
              >
                Reserve Rental
              </Button>

              <div className="text-center text-[11px] text-[var(--color-muted-grey)]">
                You won't be charged yet. Host confirms in &lt; 2 hours.
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]/95 backdrop-blur-xl border-t border-[var(--color-border)] px-5 py-3.5 flex items-center justify-between z-40 shadow-2xl">
        <div>
          <PriceDisplay price={dailyRate} period="day" size="md" />
          <div className="text-xs text-[var(--color-muted-grey)] font-medium">
            {rentalDays} day{rentalDays !== 1 ? "s" : ""} selected
          </div>
        </div>

        <Button variant="primary" size="md" onClick={() => setBookingModalOpen(true)}>
          Reserve
        </Button>
      </div>

      {/* Booking Checkout & Confirmation Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setBookingSuccess(false);
        }}
        title={bookingSuccess ? "Booking Confirmed!" : "Review & Confirm Rental"}
      >
        {bookingSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-[var(--color-espresso)] mb-2">
              Your reservation is placed!
            </h3>
            <p className="text-sm text-[var(--color-secondary-text)] leading-relaxed mb-6">
              Host <strong>{listing.ownerName || "Aswathy"}</strong> has received your reservation request for <strong>{listing.title}</strong> from {startDate} to {endDate}.
            </p>

            <div className="flex gap-3 justify-center">
              <Link to="/bookings">
                <Button variant="primary">View My Bookings</Button>
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
                <h4 className="font-extrabold text-sm text-[var(--color-espresso)] mb-1">{listing.title}</h4>
                <div className="text-xs text-[var(--color-muted-grey)]">{listing.location}</div>
              </div>
            </div>

            <div className="bg-[var(--color-surface-secondary)] p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Dates:</span>
                <span className="font-semibold text-[var(--color-espresso)]">{startDate} to {endDate} ({rentalDays} days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-grey)]">Security Deposit:</span>
                <span className="font-semibold text-emerald-600">₹{securityDeposit.toLocaleString("en-IN")} (Refundable)</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline border-t border-[var(--color-border-subtle)] pt-3">
              <span className="font-semibold text-sm text-[var(--color-espresso)]">Total Due Now</span>
              <span className="font-extrabold text-xl text-[var(--color-brand-primary)]">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setBookingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleBookingSubmit}
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
