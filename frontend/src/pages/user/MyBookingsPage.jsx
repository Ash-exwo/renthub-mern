import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  MessageSquare,
  Star,
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertCircle,
  CreditCard,
  Receipt,
  Lock,
} from "lucide-react";
import api from "../../utils/api";
import Container from "../../components/Container";
import {
  Button,
  Card,
  StatusBadge,
  Tabs,
  EmptyState,
  Modal,
} from "../../components/ui";
import RentHubCheckoutModal from "../../components/RentHubCheckoutModal";
import PaymentReceiptModal from "../../components/PaymentReceiptModal";
import ReviewModal from "../../components/ReviewModal";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60";

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState("");

  const [checkoutBookingId, setCheckoutBookingId] = useState(null);
  const [receiptBookingId, setReceiptBookingId] = useState(null);

  const [bookingToReview, setBookingToReview] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState({});

  const fetchBookings = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError("");
    try {
      const res = await api.get("/bookings/my-rentals");
      if (res.data?.bookings) {
        setBookings(res.data.bookings);
        const completed = res.data.bookings.filter((b) => b.status === "completed");
        if (completed.length > 0) {
          Promise.all(
            completed.map((b) =>
              api
                .get(`/reviews/booking/${b._id}`)
                .then((r) => (r.data?.hasReviewed ? { id: b._id, review: r.data.review } : null))
                .catch(() => null)
            )
          ).then((results) => {
            const map = {};
            results.forEach((item) => {
              if (item) map[item.id] = item.review;
            });
            setReviewedBookings((prev) => ({ ...prev, ...map }));
          });
        }
      }
    } catch (err) {
      if (!isBackground) {
        setError(
          err.response?.data?.message ||
            "Failed to load your rental bookings. Please refresh."
        );
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // 1. Instant re-fetch when user switches to this browser window/tab
    const handleFocus = () => fetchBookings(true);
    window.addEventListener("focus", handleFocus);

    // 2. Instant re-fetch when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchBookings(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 3. Fast auto-poll (every 4s) so host acceptance, completion, and refunds update live
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 4000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const tabs = [
    { id: "all", label: "All Bookings", count: bookings.length },
    {
      id: "pending",
      label: "Pending",
      count: bookings.filter((b) => b.status === "pending").length,
    },
    {
      id: "confirmed",
      label: "Confirmed",
      count: bookings.filter((b) => b.status === "confirmed").length,
    },
    {
      id: "completed",
      label: "Completed",
      count: bookings.filter((b) => b.status === "completed").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: bookings.filter((b) => b.status === "cancelled" || b.status === "rejected").length,
    },
  ];

  const filteredBookings =
    activeTab === "all"
      ? bookings
      : activeTab === "cancelled"
      ? bookings.filter((b) => b.status === "cancelled" || b.status === "rejected")
      : bookings.filter((b) => b.status === activeTab);

  const handleOpenCancel = (booking) => {
    setBookingToCancel(booking);
    setCancelReason("");
    setActionError("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancellingId(bookingToCancel._id);
    setActionError("");

    try {
      await api.patch(`/bookings/${bookingToCancel._id}/status`, {
        status: "cancelled",
        reason: cancelReason || "Cancelled by renter",
      });
      setCancelModalOpen(false);
      setBookingToCancel(null);
      await fetchBookings();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to cancel booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenReview = (booking) => {
    setBookingToReview(booking);
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = (newReview) => {
    if (bookingToReview) {
      setReviewedBookings((prev) => ({
        ...prev,
        [bookingToReview._id]: newReview,
      }));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="mb-8">
          <span className="text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-wider">
            Renter Portal
          </span>
          <h1 className="font-[var(--font-heading)] text-2xl sm:text-4xl font-extrabold text-[var(--color-espresso)] mt-1 mb-2">
            My Rentals & Bookings
          </h1>
          <p className="text-sm text-[var(--color-muted-grey)]">
            Track reservation statuses, coordinate with item owners, download receipts, and manage your rentals.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mb-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
        </div>

        {/* Loading and Error states */}
        {loading ? (
          <div className="py-20 text-center text-[var(--color-muted-grey)]">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold">Loading your rental bookings...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-center my-8">
            <AlertCircle size={28} className="mx-auto mb-2" />
            <p className="text-sm font-bold">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchBookings}>
              Try Again
            </Button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title={`No ${activeTab !== "all" ? activeTab.toLowerCase() : ""} rentals found`}
            description="You don't have any rental bookings matching this category right now."
            actionLabel="Explore Catalog"
            onAction={() => (window.location.href = "/explore")}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {filteredBookings.map((b) => {
              const listingTitle = b.listing?.title || "Rental Listing";
              const listingImg = b.listing?.images?.[0] || FALLBACK_IMAGE;
              const listingLocation = b.listing?.location || "Location not set";
              const ownerName = b.owner?.name || "Host";

              return (
                <Card key={b._id} padding="md" variant="default">
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-5 items-center">
                    <img
                      src={listingImg}
                      alt={listingTitle}
                      className="w-full md:w-28 h-28 object-cover rounded-xl shrink-0"
                    />

                    <div>
                      <div className="flex gap-2 items-center flex-wrap mb-1.5">
                        <span className="font-mono text-xs font-bold text-[var(--color-muted-grey)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded-md">
                          REF: {b._id.slice(-6).toUpperCase()}
                        </span>
                        <StatusBadge status={b.status} size="sm" />
                        {b.status === "pending" && (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                            <Clock size={12} /> Awaiting host confirmation
                          </span>
                        )}
                        {/* Escrow & Payment Indicator */}
                        {b.paymentStatus === "escrow_held" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck size={12} /> Paid · Escrow Secured
                          </span>
                        )}
                        {b.paymentStatus === "refunded" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                            <Receipt size={12} /> Refund Issued
                          </span>
                        )}
                        {b.paymentStatus === "payout_released" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                            <CheckCircle2 size={12} /> Completed · Deposit Returned
                          </span>
                        )}
                        {b.paymentStatus === "unpaid" && b.status === "confirmed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <CreditCard size={12} /> Action Required: Pay Escrow
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[var(--color-espresso)] mb-1">
                        {b.listing ? (
                          <Link
                            to={`/listings/${b.listing._id || b.listing}`}
                            className="hover:text-[var(--color-brand-primary)] transition-colors"
                          >
                            {listingTitle}
                          </Link>
                        ) : (
                          listingTitle
                        )}
                      </h3>

                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[var(--color-secondary-text)] mt-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-[var(--color-brand-primary)] shrink-0" />
                          <span>
                            {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)} ({b.days}{" "}
                            {b.days === 1 ? "day" : "days"})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[var(--color-brand-primary)] shrink-0" />
                          <span>{listingLocation}</span>
                        </div>
                        <div className="text-[var(--color-muted-grey)]">
                          Host: <strong className="text-[var(--color-espresso)]">{ownerName}</strong>
                        </div>
                      </div>

                      {/* Option 1 Guidance callouts */}
                      {b.status === "pending" && (
                        <div className="mt-2.5 text-xs text-[var(--color-muted-grey)] bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border-subtle)] p-2 rounded-lg flex items-center gap-2">
                          <Clock size={13} className="shrink-0 text-amber-500" />
                          <span>Your request has been sent to {ownerName}. You will not be charged until the host reviews and accepts.</span>
                        </div>
                      )}

                      {b.status === "confirmed" && b.paymentStatus === "unpaid" && (
                        <div className="mt-2.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-start gap-2">
                          <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <div>
                            <strong className="font-semibold">Host Accepted Your Request!</strong>
                            <span> Complete payment now to secure escrow and finalize your booking before handover.</span>
                          </div>
                        </div>
                      )}

                      {b.status === "confirmed" && b.paymentStatus === "escrow_held" && (
                        <div className="mt-2.5 text-xs text-blue-800 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg flex items-center gap-2">
                          <ShieldCheck size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>Escrow secured! Coordinate with host for handover on {formatDate(b.startDate)}.</span>
                        </div>
                      )}

                      {b.rejectionReason && b.status === "rejected" && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded-lg">
                          Decline note: {b.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--color-border-subtle)]">
                      <div className="text-left md:text-right">
                        <div className="text-[11px] text-[var(--color-muted-grey)]">Total Rental Charge</div>
                        <div className="font-extrabold text-lg text-[var(--color-brand-primary)]">
                          ₹{b.totalPrice.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Deposit: ₹{(b.deposit || 0).toLocaleString("en-IN")} (Refundable)
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {/* Option 1: Escrow Payment only available once confirmed */}
                        {b.status === "confirmed" && b.paymentStatus === "unpaid" && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CreditCard}
                            onClick={() => setCheckoutBookingId(b._id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
                          >
                            Pay & Secure Escrow
                          </Button>
                        )}
                        {b.paymentStatus && b.paymentStatus !== "unpaid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Receipt}
                            onClick={() => setReceiptBookingId(b._id)}
                          >
                            Escrow Receipt
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(b)}
                        >
                          Booking Details
                        </Button>

                        {(b.status === "pending" || b.status === "confirmed") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                            onClick={() => handleOpenCancel(b)}
                          >
                            Cancel
                          </Button>
                        )}

                        {b.status === "completed" && (
                          reviewedBookings[b._id] ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                              <Star size={13} className="fill-amber-400 text-amber-400" />
                              <span>Reviewed ({reviewedBookings[b._id].rating}★)</span>
                            </span>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Star}
                              onClick={() => handleOpenReview(b)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm"
                            >
                              Leave a Review
                            </Button>
                          )
                        )}

                        {(b.status === "confirmed" || b.status === "completed") && (
                          <Link
                            to={`/messages?bookingId=${b._id}&targetUser=${encodeURIComponent(ownerName)}&listingTitle=${encodeURIComponent(listingTitle)}&tab=renting`}
                          >
                            <Button variant="secondary" size="sm" icon={MessageSquare}>
                              Chat Host
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>

      {/* Booking Details / Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedBooking && !reviewModalOpen)}
        onClose={() => setSelectedBooking(null)}
        title="Rental Confirmation & Cost Breakdown"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-[var(--color-muted-grey)]">Booking ID</span>
                <div className="font-mono font-bold text-base text-[var(--color-espresso)]">
                  {selectedBooking._id}
                </div>
              </div>
              <StatusBadge status={selectedBooking.status} />
            </div>

            <div className="bg-[var(--color-surface-secondary)] p-4 rounded-xl space-y-1.5 text-xs border border-[var(--color-border-subtle)]">
              <div className="font-bold text-sm text-[var(--color-espresso)]">
                {selectedBooking.listing?.title || "Rental Listing"}
              </div>
              <div className="text-[var(--color-muted-grey)]">
                Host: {selectedBooking.owner?.name} ({selectedBooking.owner?.email || "Protected"})
              </div>
              <div className="text-[var(--color-muted-grey)]">
                Dates: {formatDate(selectedBooking.startDate)} to {formatDate(selectedBooking.endDate)} (
                {selectedBooking.days} {selectedBooking.days === 1 ? "day" : "days"})
              </div>
              <div className="text-[var(--color-muted-grey)]">
                Pickup Location: {selectedBooking.listing?.location || "Provided by host upon confirmation"}
              </div>
              {selectedBooking.notes && (
                <div className="pt-1.5 border-t border-[var(--color-border-subtle)] text-[var(--color-espresso)] italic">
                  " {selectedBooking.notes} "
                </div>
              )}
            </div>

            <div>
              <div className="font-bold text-xs uppercase tracking-wider text-[var(--color-espresso)] mb-2">
                Cost Breakdown
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-[var(--color-secondary-text)]">
                <div className="flex justify-between">
                  <span>
                    Base Rent ({selectedBooking.days} days @ ₹{selectedBooking.dailyRate}/day)
                  </span>
                  <span className="font-semibold text-[var(--color-espresso)]">
                    ₹{selectedBooking.basePrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit (Refundable upon safe return)</span>
                  <span className="text-emerald-600 font-semibold">
                    ₹{(selectedBooking.deposit || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Protection & Service Fee</span>
                  <span className="font-semibold text-[var(--color-espresso)]">
                    ₹{(selectedBooking.serviceFee || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-[var(--color-brand-primary)] border-t border-[var(--color-border-subtle)] pt-2 mt-1">
                  <span>Total Due</span>
                  <span>₹{selectedBooking.totalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-grey)] bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>Includes RentHub Security Deposit Protection guarantee.</span>
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" fullWidth onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
              <Link
                to={`/messages?bookingId=${selectedBooking._id}&targetUser=${encodeURIComponent(selectedBooking.owner?.name || "Host")}&listingTitle=${encodeURIComponent(selectedBooking.listing?.title || "Item")}&tab=renting`}
                className="w-full"
              >
                <Button variant="primary" fullWidth icon={MessageSquare}>
                  Chat with Host
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          if (!cancellingId) setCancelModalOpen(false);
        }}
        title="Cancel Rental Booking"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-secondary-text)] leading-relaxed">
            Are you sure you want to cancel your reservation for{" "}
            <strong>{bookingToCancel?.listing?.title || "this rental"}</strong>?
          </p>

          {actionError && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule changed, found alternative, etc."
              className="w-full text-xs p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              maxLength={300}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              fullWidth
              disabled={Boolean(cancellingId)}
              onClick={() => setCancelModalOpen(false)}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={Boolean(cancellingId)}
              onClick={handleConfirmCancel}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verified Reviews & Ratings Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setBookingToReview(null);
          fetchBookings(true);
        }}
        booking={bookingToReview}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Interactive RentHub Escrow Checkout Modal */}
      <RentHubCheckoutModal
        isOpen={Boolean(checkoutBookingId)}
        onClose={() => {
          setCheckoutBookingId(null);
          fetchBookings(true);
        }}
        bookingId={checkoutBookingId}
        onPaymentSuccess={() => {
          fetchBookings(true);
        }}
        onSuccess={() => {
          fetchBookings(true);
        }}
      />

      {/* Itemized Payment & Escrow Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptBookingId)}
        onClose={() => {
          setReceiptBookingId(null);
          fetchBookings(true);
        }}
        bookingId={receiptBookingId}
      />
    </div>
  );
}
