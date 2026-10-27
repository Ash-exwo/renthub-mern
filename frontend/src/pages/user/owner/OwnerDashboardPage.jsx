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
  Scale,
  Key,
  Lock,
  Camera,
  ImagePlus,
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

  // Handover (Pickup OTP) modal state
  const [handoverModal, setHandoverModal] = useState({
    open: false,
    booking: null,
    pickupOtp: "",
    notes: "",
    photos: [],
    photoInput: "",
    submitting: false,
    error: "",
  });

  // Return (Return OTP) modal state
  const [returnModal, setReturnModal] = useState({
    open: false,
    booking: null,
    returnOtp: "",
    conditionStatus: "good",
    notes: "",
    photos: [],
    photoInput: "",
    submitting: false,
    error: "",
  });

  // Security Deposit Damage Claim modal state
  const [claimModal, setClaimModal] = useState({
    open: false,
    booking: null,
    dispute: null,
    claimAmount: "",
    reason: "",
    damagePhotos: [],
    photoInput: "",
    submitting: false,
    error: "",
    successMsg: "",
  });

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

  const handleOpenHandover = (booking) => {
    setHandoverModal({
      open: true,
      booking,
      pickupOtp: "",
      notes: "Physical item handed over in good operational condition with all accessories.",
      photos: [],
      photoInput: "",
      submitting: false,
      error: "",
    });
  };

  const handleConfirmHandover = async () => {
    if (!handoverModal.booking || !handoverModal.pickupOtp.trim()) {
      setHandoverModal((prev) => ({ ...prev, error: "Please enter the 6-digit Renter Pickup PIN." }));
      return;
    }
    setHandoverModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      await api.post(`/bookings/${handoverModal.booking._id}/verify-pickup`, {
        otp: handoverModal.pickupOtp.trim(),
        pickupOtp: handoverModal.pickupOtp.trim(),
        photos: handoverModal.photos,
        notes: handoverModal.notes.trim(),
      });
      setHandoverModal({ open: false, booking: null, pickupOtp: "", notes: "", photos: [], photoInput: "", submitting: false, error: "" });
      await fetchDashboardData();
    } catch (err) {
      setHandoverModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.message || "Failed to verify pickup OTP. Please verify the PIN with the renter.",
      }));
    }
  };

  const handleOpenReturn = (booking) => {
    setReturnModal({
      open: true,
      booking,
      returnOtp: "",
      conditionStatus: "good",
      notes: "Returned on schedule in good condition.",
      photos: [],
      photoInput: "",
      submitting: false,
      error: "",
    });
  };

  const handleConfirmReturn = async () => {
    if (!returnModal.booking || !returnModal.returnOtp.trim()) {
      setReturnModal((prev) => ({ ...prev, error: "Please enter the 6-digit Renter Return PIN." }));
      return;
    }
    setReturnModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const res = await api.post(`/bookings/${returnModal.booking._id}/verify-return`, {
        otp: returnModal.returnOtp.trim(),
        returnOtp: returnModal.returnOtp.trim(),
        conditionStatus: returnModal.conditionStatus,
        photos: returnModal.photos,
        notes: returnModal.notes.trim(),
      });
      const updatedBooking = res.data?.booking;
      const condition = returnModal.conditionStatus;
      setReturnModal({ open: false, booking: null, returnOtp: "", conditionStatus: "good", notes: "", photos: [], photoInput: "", submitting: false, error: "" });
      await fetchDashboardData();

      if (condition === "damaged" && updatedBooking) {
        handleOpenClaim(updatedBooking);
      }
    } catch (err) {
      setReturnModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.message || "Failed to verify return OTP. Please check the PIN provided by the renter.",
      }));
    }
  };

  const handleOpenClaim = async (booking) => {
    setClaimModal({
      open: true,
      booking,
      dispute: null,
      claimAmount: booking.deposit ? String(Math.min(booking.deposit, 2000)) : "1000",
      reason: "",
      damagePhotos: [],
      photoInput: "",
      submitting: false,
      error: "",
      successMsg: "",
    });

    try {
      const res = await api.get(`/disputes/booking/${booking._id}`);
      if (res.data?.dispute) {
        setClaimModal((prev) => ({
          ...prev,
          dispute: res.data.dispute,
        }));
      }
    } catch {
      // fresh claim
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimModal.booking) return;
    const amount = Number(claimModal.claimAmount);
    if (!amount || amount <= 0) {
      setClaimModal((prev) => ({ ...prev, error: "Please enter a valid claim amount greater than 0." }));
      return;
    }
    if (claimModal.booking.deposit && amount > claimModal.booking.deposit) {
      setClaimModal((prev) => ({
        ...prev,
        error: `Claim amount cannot exceed the held security deposit of ₹${claimModal.booking.deposit.toLocaleString("en-IN")}.`,
      }));
      return;
    }
    if (!claimModal.reason.trim()) {
      setClaimModal((prev) => ({ ...prev, error: "Please provide a damage explanation." }));
      return;
    }
    if (claimModal.reason.trim().length > 50) {
      setClaimModal((prev) => ({ ...prev, error: "Damage explanation cannot exceed 50 characters." }));
      return;
    }

    setClaimModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const res = await api.post("/disputes", {
        bookingId: claimModal.booking._id,
        claimAmount: amount,
        hostReason: claimModal.reason.trim(),
        reason: claimModal.reason.trim(),
        hostPhotos: claimModal.damagePhotos,
        damagePhotos: claimModal.damagePhotos,
      });

      setClaimModal((prev) => ({
        ...prev,
        submitting: false,
        dispute: res.data?.dispute,
        successMsg: "Damage claim filed successfully against escrow. Renter will be notified to review and respond.",
      }));

      await fetchDashboardData();
    } catch (err) {
      setClaimModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.message || "Failed to submit damage claim.",
      }));
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
  const approvedTotalRevenue = requests
    .filter((r) => r.status === "confirmed" || r.status === "in_progress" || r.status === "completed")
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
              Live and available for rent
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
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Key}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                              onClick={() => handleOpenHandover(req)}
                            >
                              Verify Handover (Pickup PIN)
                            </Button>
                          ) : (
                            <span className="text-xs font-bold text-amber-600 inline-flex items-center gap-1">
                              <Clock size={14} /> Accepted · Awaiting Escrow
                            </span>
                          )}
                        </div>
                      )}

                      {req.status === "in_progress" && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                          onClick={() => handleOpenReturn(req)}
                        >
                          Verify Return (Return PIN)
                        </Button>
                      )}

                      {req.status === "disputed" && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Scale}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                          onClick={() => handleOpenClaim(req)}
                        >
                          Damage Claim / Tribunal
                        </Button>
                      )}

                      {(isConfirmed || req.status === "in_progress" || req.status === "disputed" || req.status === "completed") && (
                        <Link
                          to={`/messages?bookingId=${req._id}&targetUser=${encodeURIComponent(renterName)}&listingTitle=${encodeURIComponent(listingTitle)}&tab=hosting`}
                        >
                          <Button variant="secondary" size="sm" icon={MessageSquare}>
                            Chat Renter
                          </Button>
                        </Link>
                      )}

                      {!isPending && !isConfirmed && req.status !== "in_progress" && req.status !== "disputed" && (
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

      {/* Verify Handover (Pickup OTP) Modal */}
      <Modal
        isOpen={handoverModal.open}
        onClose={() =>
          setHandoverModal((prev) => ({
            ...prev,
            open: false,
            error: "",
          }))
        }
        title="Physical Handover & Pre-Rental Inspection"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-secondary-text)] leading-relaxed">
            Verify the 6-digit Pickup PIN shown on the renter's device and document pre-rental condition. Upon verification, the booking becomes active <strong>In Progress</strong>.
          </p>

          {handoverModal.error && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold">
              {handoverModal.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Renter's 6-Digit Pickup PIN:
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 149929"
              value={handoverModal.pickupOtp}
              onChange={(e) =>
                setHandoverModal((prev) => ({
                  ...prev,
                  pickupOtp: e.target.value.replace(/\D/g, ""),
                }))
              }
              className="w-full text-center tracking-widest font-mono text-lg font-bold p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Pre-Rental Handover Notes:
            </label>
            <textarea
              rows={2}
              value={handoverModal.notes}
              onChange={(e) =>
                setHandoverModal((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Note cosmetic wear, included cables, serial numbers, or battery levels..."
              className="w-full text-xs p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Pre-Rental Inspection Photos (URLs):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste photo URL (or test photo)..."
                value={handoverModal.photoInput}
                onChange={(e) =>
                  setHandoverModal((prev) => ({
                    ...prev,
                    photoInput: e.target.value,
                  }))
                }
                className="flex-1 text-xs p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (handoverModal.photoInput.trim()) {
                    setHandoverModal((prev) => ({
                      ...prev,
                      photos: [...prev.photos, prev.photoInput.trim()],
                      photoInput: "",
                    }));
                  }
                }}
              >
                Add
              </Button>
            </div>
            {handoverModal.photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {handoverModal.photos.map((url, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-espresso)]"
                  >
                    <span>Photo #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setHandoverModal((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-red-500 font-bold hover:underline"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() =>
                setHandoverModal((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={handoverModal.submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              onClick={handleConfirmHandover}
            >
              Verify PIN &amp; Activate Rental
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verify Return (Return OTP) Modal */}
      <Modal
        isOpen={returnModal.open}
        onClose={() =>
          setReturnModal((prev) => ({ ...prev, open: false, error: "" }))
        }
        title="Physical Return & Condition Verification"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-secondary-text)] leading-relaxed">
            Verify the 6-digit Return PIN from the renter upon physical return and inspect the asset.
          </p>

          {returnModal.error && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold">
              {returnModal.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Renter's 6-Digit Return PIN:
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 979076"
              value={returnModal.returnOtp}
              onChange={(e) =>
                setReturnModal((prev) => ({
                  ...prev,
                  returnOtp: e.target.value.replace(/\D/g, ""),
                }))
              }
              className="w-full text-center tracking-widest font-mono text-lg font-bold p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1.5">
              Asset Condition Assessment:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setReturnModal((prev) => ({ ...prev, conditionStatus: "good" }))
                }
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  returnModal.conditionStatus === "good"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-grey)]"
                }`}
              >
                <CheckCircle2 size={18} />
                <span>Good Condition</span>
                <span className="text-[10px] font-normal text-emerald-600">
                  Release Escrow &amp; Deposit
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setReturnModal((prev) => ({ ...prev, conditionStatus: "damaged" }))
                }
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  returnModal.conditionStatus === "damaged"
                    ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-grey)]"
                }`}
              >
                <AlertCircle size={18} />
                <span>Damage / Issue</span>
                <span className="text-[10px] font-normal text-rose-600">
                  Hold Deposit in Dispute
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Return Inspection Notes:
            </label>
            <textarea
              rows={2}
              value={returnModal.notes}
              onChange={(e) =>
                setReturnModal((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="State cleanliness, check operations, note any issues or safe return..."
              className="w-full text-xs p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
              Return Inspection Photos (URLs):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste photo URL..."
                value={returnModal.photoInput}
                onChange={(e) =>
                  setReturnModal((prev) => ({
                    ...prev,
                    photoInput: e.target.value,
                  }))
                }
                className="flex-1 text-xs p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (returnModal.photoInput.trim()) {
                    setReturnModal((prev) => ({
                      ...prev,
                      photos: [...prev.photos, prev.photoInput.trim()],
                      photoInput: "",
                    }));
                  }
                }}
              >
                Add
              </Button>
            </div>
            {returnModal.photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {returnModal.photos.map((url, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-espresso)]"
                  >
                    <span>Photo #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setReturnModal((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-red-500 font-bold hover:underline"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setReturnModal((prev) => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={returnModal.submitting}
              className={
                returnModal.conditionStatus === "damaged"
                  ? "bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              }
              onClick={handleConfirmReturn}
            >
              {returnModal.conditionStatus === "damaged"
                ? "Confirm Return & Hold in Dispute"
                : "Confirm Return & Conclude Rental"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Security Deposit Damage Claim Modal */}
      <Modal
        isOpen={claimModal.open}
        onClose={() =>
          setClaimModal((prev) => ({
            ...prev,
            open: false,
            error: "",
            successMsg: "",
          }))
        }
        title="Security Deposit Damage Claim"
      >
        <div className="flex flex-col gap-4">
          {claimModal.successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              {claimModal.successMsg}
            </div>
          )}

          {claimModal.error && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold">
              {claimModal.error}
            </div>
          )}

          {/* If a dispute already exists */}
          {claimModal.dispute ? (
            <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/70 border border-[var(--color-border)] space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]">
                    Dispute Status
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-extrabold capitalize px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {claimModal.dispute.status === "pending_renter" || claimModal.dispute.status === "pending_renter_response"
                        ? "Awaiting Renter Response"
                        : claimModal.dispute.status === "escalated_to_admin"
                        ? "Under Admin Tribunal Review"
                        : "Arbitration Resolved"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]">
                    Claimed Amount
                  </span>
                  <div className="text-lg font-black text-rose-600">
                    ₹{claimModal.dispute.claimAmount?.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--color-secondary-text)]">
                <span className="font-bold text-[var(--color-espresso)] block mb-1">
                  Damage Statement:
                </span>
                <p className="italic bg-[var(--color-surface)] p-2.5 rounded-xl border border-[var(--color-border-subtle)] font-medium">
                  "{claimModal.dispute.hostReason || claimModal.dispute.reason || "No claim explanation provided."}"
                </p>
              </div>

              {(claimModal.dispute.renterResponse?.counterReason || claimModal.dispute.renterNotes) && (
                <div className="text-xs text-[var(--color-secondary-text)]">
                  <span className="font-bold text-[var(--color-espresso)] block mb-1">
                    Renter's Statement:
                  </span>
                  <p className="italic bg-blue-500/5 p-2.5 rounded-xl border border-blue-500/20">
                    "{claimModal.dispute.renterResponse?.counterReason || claimModal.dispute.renterNotes}"
                  </p>
                </div>
              )}

              {claimModal.dispute.status === "resolved" && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                  <div className="font-bold">
                    Admin Ruling: {(claimModal.dispute.resolution?.ruling || claimModal.dispute.adminRuling || "").replace(/_/g, " ").toUpperCase()}
                  </div>
                  <div className="flex justify-between">
                    <span>Awarded to You (Host):</span>
                    <strong className="text-emerald-600">₹{(claimModal.dispute.resolution?.hostAwardAmount ?? claimModal.dispute.awardedToHost ?? 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Refunded to Renter:</span>
                    <span>₹{(claimModal.dispute.resolution?.renterRefundAmount ?? claimModal.dispute.refundedToRenter ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClaimModal((prev) => ({ ...prev, open: false }))}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            /* File new claim form */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                <div className="font-bold">Security Deposit Held: ₹{(claimModal.booking?.deposit || 0).toLocaleString("en-IN")}</div>
                <div className="text-[11px] mt-0.5">
                  You can file a damage claim against the platform escrow deposit. Enter the repair/replacement estimate and provide supporting photos.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
                  Claim Amount (₹):
                </label>
                <input
                  type="number"
                  min="1"
                  max={claimModal.booking?.deposit || 100000}
                  value={claimModal.claimAmount}
                  onChange={(e) =>
                    setClaimModal((prev) => ({
                      ...prev,
                      claimAmount: e.target.value,
                    }))
                  }
                  placeholder="e.g. 2500"
                  className="w-full text-xs p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-[var(--color-espresso)]">
                    Damage Description &amp; Repair Itemization:
                  </label>
                  <span className="text-[10px] text-[var(--color-muted-grey)] font-medium">
                    {claimModal.reason.length}/50 characters
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={50}
                  value={claimModal.reason}
                  onChange={(e) =>
                    setClaimModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Describe damage observed (max 50 characters)..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1">
                  Damage Evidence Photos (URLs):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste damage photo URL..."
                    value={claimModal.photoInput}
                    onChange={(e) =>
                      setClaimModal((prev) => ({
                        ...prev,
                        photoInput: e.target.value,
                      }))
                    }
                    className="flex-1 text-xs p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (claimModal.photoInput.trim()) {
                        setClaimModal((prev) => ({
                          ...prev,
                          damagePhotos: [
                            ...prev.damagePhotos,
                            prev.photoInput.trim(),
                          ],
                          photoInput: "",
                        }));
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {claimModal.damagePhotos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {claimModal.damagePhotos.map((url, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-espresso)]"
                      >
                        <span>Evidence #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setClaimModal((prev) => ({
                              ...prev,
                              damagePhotos: prev.damagePhotos.filter(
                                (_, i) => i !== idx
                              ),
                            }))
                          }
                          className="text-red-500 font-bold hover:underline"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() =>
                    setClaimModal((prev) => ({ ...prev, open: false }))
                  }
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  loading={claimModal.submitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  onClick={handleSubmitClaim}
                >
                  Submit Claim Against Deposit
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
