import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  TrendingUp,
  Star,
  Plus,
  Check,
  X,
  Clock,
  Calendar,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Receipt,
  CreditCard,
} from "lucide-react";
import api from "../../../utils/api";
import { getUser } from "../../../utils/auth";
import Container from "../../../components/Container";
import {
  Button,
  Card,
  StatusBadge,
  Modal,
} from "../../../components/ui";
import OwnerListingCalendarModal from "../../../components/OwnerListingCalendarModal";
import PaymentReceiptModal from "../../../components/PaymentReceiptModal";

export default function OwnerDashboardPage() {
  const user = getUser();

  const [myListingsCount, setMyListingsCount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [selectedCalendarListingId, setSelectedCalendarListingId] = useState(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [receiptBookingId, setReceiptBookingId] = useState(null);

  // Decline modal state
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [bookingToDecline, setBookingToDecline] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  const fetchDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    setError("");
    try {
      const [listingsRes, requestsRes] = await Promise.all([
        api.get("/listings/my-listings").catch(() => ({ data: { listings: [] } })),
        api.get("/bookings/owner-requests").catch(() => ({ data: { bookings: [] } })),
      ]);

      if (listingsRes.data?.listings) {
        setMyListingsCount(listingsRes.data.listings.length);
      }
      if (requestsRes.data?.bookings) {
        setRequests(requestsRes.data.bookings);
      }
    } catch (err) {
      if (!isBackground) setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh when host returns to browser tab
    const handleFocus = () => fetchDashboardData(true);
    window.addEventListener("focus", handleFocus);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboardData(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Auto-poll every 4 seconds so incoming requests, escrow deposits, and reviews pop up live
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 4000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const handleApprove = async (bookingId) => {
    setActionLoadingId(bookingId);
    setActionError("");
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status: "confirmed",
      });
      await fetchDashboardData();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to approve booking request."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenDecline = (booking) => {
    setBookingToDecline(booking);
    setDeclineReason("");
    setActionError("");
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!bookingToDecline) return;
    setActionLoadingId(bookingToDecline._id);
    setActionError("");
    try {
      await api.patch(`/bookings/${bookingToDecline._id}/status`, {
        status: "rejected",
        reason: declineReason || "Declined by owner",
      });
      setDeclineModalOpen(false);
      setBookingToDecline(null);
      await fetchDashboardData();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to decline booking request."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkCompleted = async (bookingId) => {
    if (!window.confirm("Mark this rental as completed and conclude the handover?")) return;
    setActionLoadingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status: "completed",
      });
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark booking as completed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
  const approvedTotalRevenue = requests
    .filter((r) => r.status === "confirmed" || r.status === "completed")
    .reduce((sum, r) => sum + (r.basePrice || 0), 0);

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
        {/* Header Title */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-wider">
              Hosting Portal
            </span>
            <h1 className="font-[var(--font-heading)] text-2xl sm:text-4xl font-extrabold text-[var(--color-espresso)] mt-1">
              Owner Dashboard
            </h1>
            <p className="text-sm text-[var(--color-muted-grey)] mt-1">
              Manage rental requests, monitor earnings, and publish new assets.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link to="/my-listings">
              <Button variant="outline" size="md">
                View My Listings
              </Button>
            </Link>
            <Link to="/listings/new">
              <Button variant="primary" size="md" icon={Plus}>
                Create New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Action Error Alert */}
        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError("")}
              className="text-xs underline hover:no-underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bento Stat Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Active Listings</span>
                <h3 className="text-3xl font-extrabold text-[var(--color-espresso)] mt-1">
                  {myListingsCount}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-[var(--color-brand-primary)] grid place-items-center">
                <Building2 size={20} />
              </div>
            </div>
            <div className="text-xs text-[var(--color-muted-grey)] mt-3">
              Published on live catalog
            </div>
          </Card>

          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Rental Earnings</span>
                <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                  ₹{approvedTotalRevenue.toLocaleString("en-IN")}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-xs text-[var(--color-muted-grey)] mt-3">
              Confirmed rental payouts
            </div>
          </Card>

          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Pending Requests</span>
                <h3 className="text-3xl font-extrabold text-cyan-600 mt-1">
                  {pendingRequestsCount}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 grid place-items-center">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-xs text-cyan-600 font-semibold mt-3">
              {pendingRequestsCount > 0 ? "Requires owner response" : "All caught up"}
            </div>
          </Card>

          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Host Rating</span>
                <h3 className="text-3xl font-extrabold text-[var(--color-espresso)] mt-1">
                  5.0 ★
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
                <Star size={20} />
              </div>
            </div>
            <div className="text-xs text-[var(--color-muted-grey)] mt-3">
              Verified Host Profile
            </div>
          </Card>
        </div>

        {/* Booking Requests List */}
        <Card padding="lg" className="mb-10">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-espresso)]">Rental Booking Requests</h2>
              <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                Review and approve or decline incoming renter requests.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={isRefreshing}
              onClick={() => fetchDashboardData(true)}
            >
              {isRefreshing ? "Syncing..." : "Refresh Requests"}
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[var(--color-muted-grey)]">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold">Loading rental requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface-subtle)]">
              <Clock size={32} className="mx-auto text-[var(--color-muted-grey)] mb-2 opacity-40" />
              <h3 className="font-bold text-sm text-[var(--color-espresso)]">No Rental Requests Yet</h3>
              <p className="text-xs text-[var(--color-muted-grey)] mt-1 max-w-sm mx-auto">
                When renters place a reservation request on your listings, their inquiries will appear here for your review and approval.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((req) => {
                const listingTitle = req.listing?.title || "Rental Listing";
                const renterName = req.renter?.name || "Renter";
                const renterEmail = req.renter?.email || "";
                const isPending = req.status === "pending";
                const isConfirmed = req.status === "confirmed";
                const isProcessing = actionLoadingId === req._id;

                return (
                  <div
                    key={req._id}
                    className={`border border-[var(--color-border-subtle)] rounded-xl p-4 sm:p-5 flex justify-between items-center flex-wrap gap-4 transition-all ${
                      isPending ? "bg-[var(--color-surface)] shadow-xs" : "bg-[var(--color-surface-subtle)]"
                    }`}
                  >
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-[var(--color-espresso)]">{listingTitle}</span>
                        <StatusBadge status={req.status} size="sm" />
                        <span className="font-mono text-[11px] text-[var(--color-muted-grey)]">
                          REF: {req._id.slice(-6).toUpperCase()}
                        </span>
                        {/* Escrow Status Indicator */}
                        {req.paymentStatus === "escrow_held" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck size={12} /> Escrow Secured
                          </span>
                        )}
                        {req.paymentStatus === "refunded" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                            <Receipt size={12} /> Escrow Refunded
                          </span>
                        )}
                        {req.paymentStatus === "payout_released" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                            <CheckCircle2 size={12} /> Payout Released
                          </span>
                        )}
                        {req.paymentStatus === "unpaid" && req.status === "confirmed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <CreditCard size={12} /> Awaiting Escrow
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[var(--color-muted-grey)] mt-1">
                        Renter: <strong className="text-[var(--color-espresso)]">{renterName}</strong> ({renterEmail})
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-secondary-text)] mt-1 flex-wrap">
                        <Calendar size={13} className="text-[var(--color-brand-primary)] shrink-0" />
                        <span>
                          {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)} ({req.days}{" "}
                          {req.days === 1 ? "day" : "days"})
                        </span>
                        {(req.listing?._id || req.listing) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCalendarListingId(req.listing?._id || req.listing);
                              setCalendarModalOpen(true);
                            }}
                            className="ml-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>· View Schedule</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-[var(--color-secondary-text)] mt-1">
                        Rental payout: <strong className="text-emerald-600 font-bold">₹{req.basePrice?.toLocaleString("en-IN")}</strong> · Security deposit: ₹{(req.deposit || 0).toLocaleString("en-IN")}
                      </div>

                      {req.notes && (
                        <div className="mt-2 text-xs italic text-[var(--color-espresso)] bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                          Renter message: "{req.notes}"
                        </div>
                      )}

                      {/* Option 1 Handover Guard Notice */}
                      {isConfirmed && req.paymentStatus === "unpaid" && (
                        <div className="mt-2.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-start gap-2">
                          <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <strong className="font-semibold">Awaiting Renter Escrow:</strong>
                            <span> Do NOT hand over the item yet. Handover should only take place once the renter deposits funds into platform escrow.</span>
                          </div>
                        </div>
                      )}

                      {isConfirmed && req.paymentStatus === "escrow_held" && (
                        <div className="mt-2.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-center gap-2">
                          <ShieldCheck size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            <strong className="font-semibold">Escrow Secured:</strong> Payment & deposit are safely held by RentHub. You may safely hand over the item to the renter.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {req.paymentStatus !== "unpaid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Receipt}
                          onClick={() => setReceiptBookingId(req._id)}
                        >
                          Receipt
                        </Button>
                      )}

                      {isPending && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            loading={isProcessing}
                            onClick={() => handleApprove(req._id)}
                          >
                            Accept & Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={X}
                            className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                            disabled={isProcessing}
                            onClick={() => handleOpenDecline(req)}
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {isConfirmed && (
                        <div className="flex items-center gap-2">
                          {req.paymentStatus === "escrow_held" ? (
                            <>
                              <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                                <CheckCircle2 size={14} /> Confirmed
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                loading={isProcessing}
                                onClick={() => handleMarkCompleted(req._id)}
                              >
                                Mark Completed
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-amber-600 inline-flex items-center gap-1">
                                <Clock size={14} /> Accepted · Awaiting Escrow
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                title="Escrow payment must be funded before completing rental"
                                className="opacity-50 cursor-not-allowed text-xs"
                              >
                                Mark Completed
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {(isConfirmed || req.status === "completed") && (
                        <Link
                          to={`/messages?bookingId=${req._id}&targetUser=${encodeURIComponent(renterName)}&listingTitle=${encodeURIComponent(listingTitle)}`}
                        >
                          <Button variant="secondary" size="sm" icon={MessageSquare}>
                            Chat Renter
                          </Button>
                        </Link>
                      )}

                      {!isPending && !isConfirmed && (
                        <div className="text-xs font-bold capitalize text-[var(--color-muted-grey)]">
                          {req.status}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Container>

      {/* Decline Booking Modal */}
      <Modal
        isOpen={declineModalOpen}
        onClose={() => {
          if (!actionLoadingId) setDeclineModalOpen(false);
        }}
        title="Decline Rental Request"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-secondary-text)] leading-relaxed">
            Decline booking request for <strong>{bookingToDecline?.listing?.title}</strong> from renter{" "}
            <strong>{bookingToDecline?.renter?.name}</strong>?
          </p>

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Reason for Declining (Optional)
            </label>
            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Item unavailable during these dates, maintenance scheduled, etc."
              className="w-full text-xs p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              maxLength={300}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              fullWidth
              disabled={Boolean(actionLoadingId)}
              onClick={() => setDeclineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={Boolean(actionLoadingId)}
              onClick={handleConfirmDecline}
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>

      {/* Owner Availability Calendar Modal */}
      <OwnerListingCalendarModal
        listingId={selectedCalendarListingId}
        isOpen={calendarModalOpen}
        onClose={() => {
          setCalendarModalOpen(false);
          setSelectedCalendarListingId(null);
        }}
        onBookingStatusChanged={() => fetchDashboardData(true)}
      />

      {/* Escrow Payment Receipt Modal for Hosts */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptBookingId)}
        onClose={() => setReceiptBookingId(null)}
        bookingId={receiptBookingId}
      />
    </div>
  );
}
