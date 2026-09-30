import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  MessageSquare,
  Star,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import Container from "../../components/Container";
import {
  Button,
  Card,
  StatusBadge,
  Tabs,
  EmptyState,
  Modal,
} from "../../components/ui";

const INITIAL_BOOKINGS = [
  {
    id: "BK-84920",
    listingTitle: "Sony FX3 Cinema Camera + G-Master 24-70mm Kit",
    listingImage:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
    category: "Cameras",
    location: "Indiranagar, Bangalore",
    ownerName: "Rahul Nair",
    ownerPhone: "+91 98471 23456",
    startDate: "2026-09-25",
    endDate: "2026-09-28",
    days: 3,
    dailyRate: 2400,
    deposit: 8000,
    serviceFee: 360,
    totalPrice: 15560,
    status: "Upcoming",
  },
  {
    id: "BK-73819",
    listingTitle: "Panoramic Sea-View 2BHK Luxury Apartment",
    listingImage:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
    category: "Apartments",
    location: "Marine Drive, Kochi",
    ownerName: "Aswathy V",
    ownerPhone: "+91 98460 11223",
    startDate: "2026-09-20",
    endDate: "2026-09-24",
    days: 4,
    dailyRate: 3200,
    deposit: 5000,
    serviceFee: 640,
    totalPrice: 18440,
    status: "Active",
  },
  {
    id: "BK-62910",
    listingTitle: "Royal Enfield Himalayan 450 (Kamet White)",
    listingImage:
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
    category: "Vehicles",
    location: "Koramangala, Bangalore",
    ownerName: "Arjun Verma",
    ownerPhone: "+91 94470 98765",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    days: 4,
    dailyRate: 1400,
    deposit: 3000,
    serviceFee: 280,
    totalPrice: 8880,
    status: "Completed",
    reviewed: false,
  },
];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const tabs = [
    { id: "all", label: "All Bookings", count: bookings.length },
    {
      id: "Upcoming",
      label: "Upcoming",
      count: bookings.filter((b) => b.status === "Upcoming").length,
    },
    {
      id: "Active",
      label: "Active",
      count: bookings.filter((b) => b.status === "Active").length,
    },
    {
      id: "Completed",
      label: "Completed",
      count: bookings.filter((b) => b.status === "Completed").length,
    },
    {
      id: "Cancelled",
      label: "Cancelled",
      count: bookings.filter((b) => b.status === "Cancelled").length,
    },
  ];

  const filteredBookings =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  const handleCancelBooking = (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation? Full refund applies to security deposits.")) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b))
    );
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(null);
    }
  };

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
    setReviewSuccess(false);
    setReviewText("");
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setReviewSuccess(true);
    if (selectedBooking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBooking.id ? { ...b, reviewed: true } : b))
      );
    }
  };

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="mb-8">
          <h1 className="font-[var(--font-heading)] text-2xl sm:text-4xl font-extrabold text-[var(--color-espresso)] mb-2">
            My Bookings & Rentals
          </h1>
          <p className="text-sm text-[var(--color-muted-grey)]">
            Track active reservations, download invoices, coordinate with hosts, and leave reviews.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mb-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <EmptyState
            title={`No ${activeTab !== "all" ? activeTab.toLowerCase() : ""} bookings`}
            description="You don't have any bookings in this section right now."
            actionLabel="Explore Rentals"
            onAction={() => (window.location.href = "/explore")}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {filteredBookings.map((b) => (
              <Card key={b.id} padding="md" variant="default">
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-5 items-center">
                  <img
                    src={b.listingImage}
                    alt={b.listingTitle}
                    className="w-full md:w-24 h-24 object-cover rounded-xl"
                  />

                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <span className="text-xs font-bold text-[var(--color-muted-grey)]">
                        {b.id}
                      </span>
                      <StatusBadge status={b.status} size="sm" />
                    </div>

                    <h3 className="text-base font-bold text-[var(--color-espresso)] mb-1">
                      {b.listingTitle}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-xs text-[var(--color-secondary-text)]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[var(--color-terracotta)]" />
                        <span>{b.startDate} to {b.endDate} ({b.days} days)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[var(--color-terracotta)]" />
                        <span>{b.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--color-border-subtle)]">
                    <div className="text-left md:text-right">
                      <div className="text-[11px] text-[var(--color-muted-grey)]">Total Paid</div>
                      <div className="font-extrabold text-base text-[var(--color-espresso)]">
                        ₹{b.totalPrice.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setSelectedBooking(b)}>
                        View Receipt
                      </Button>

                      {b.status === "Upcoming" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleCancelBooking(b.id)}
                        >
                          Cancel
                        </Button>
                      )}

                      {b.status === "Completed" && (
                        <Button
                          variant={b.reviewed ? "ghost" : "primary"}
                          size="sm"
                          icon={Star}
                          disabled={b.reviewed}
                          onClick={() => handleOpenReview(b)}
                        >
                          {b.reviewed ? "Reviewed" : "Rate Rental"}
                        </Button>
                      )}

                      {b.status === "Active" && (
                        <Link to="/messages">
                          <Button variant="secondary" size="sm" icon={MessageSquare}>
                            Message Host
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>

      {/* Booking Details / Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedBooking && !reviewModalOpen)}
        onClose={() => setSelectedBooking(null)}
        title="Rental Confirmation & Receipt"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-[var(--color-muted-grey)]">Booking Reference</span>
                <div className="font-bold text-lg text-[var(--color-espresso)]">{selectedBooking.id}</div>
              </div>
              <StatusBadge status={selectedBooking.status} />
            </div>

            <div className="bg-[var(--color-surface-secondary)] p-4 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-sm text-[var(--color-espresso)]">{selectedBooking.listingTitle}</div>
              <div className="text-[var(--color-muted-grey)]">
                Host: {selectedBooking.ownerName} ({selectedBooking.ownerPhone})
              </div>
              <div className="text-[var(--color-muted-grey)]">
                Pickup Location: {selectedBooking.location}
              </div>
            </div>

            <div>
              <div className="font-bold text-xs uppercase tracking-wider text-[var(--color-espresso)] mb-2">Cost Breakdown</div>
              <div className="flex flex-col gap-1.5 text-xs text-[var(--color-secondary-text)]">
                <div className="flex justify-between">
                  <span>Base Rent ({selectedBooking.days} days @ ₹{selectedBooking.dailyRate}/day)</span>
                  <span>₹{(selectedBooking.days * selectedBooking.dailyRate).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit (Refundable upon return)</span>
                  <span className="text-emerald-600 font-semibold">₹{selectedBooking.deposit.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Protection & Service Fee</span>
                  <span>₹{selectedBooking.serviceFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[var(--color-espresso)] border-t border-[var(--color-border-subtle)] pt-2 mt-1">
                  <span>Total Paid</span>
                  <span>₹{selectedBooking.totalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-grey)]">
              <ShieldCheck size={16} className="text-[var(--color-terracotta)] shrink-0" />
              <span>Covered by RentHub ₹50,000 Damage Protection Plan</span>
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" fullWidth onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
              <Link to="/messages" className="w-full">
                <Button variant="primary" fullWidth icon={MessageSquare}>
                  Chat with Host
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Rate & Review Rental"
      >
        {reviewSuccess ? (
          <div className="text-center py-6">
            <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[var(--color-espresso)] mb-1">Thank you for your feedback!</h3>
            <p className="text-xs text-[var(--color-muted-grey)] mb-6">
              Your verified review helps build trust across the RentHub community.
            </p>
            <Button variant="primary" onClick={() => setReviewModalOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold text-[var(--color-espresso)] block mb-2">
                Overall Rating
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className="p-1 cursor-pointer bg-transparent border-none"
                  >
                    <Star
                      size={28}
                      className={s <= reviewRating ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" : "text-slate-300 dark:text-slate-600"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-espresso)] block mb-2">
                Your Review Comments
              </label>
              <textarea
                rows={4}
                required
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share details about the item's condition, host communication, or handover experience..."
                className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--color-terracotta)]"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                Submit Review
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
