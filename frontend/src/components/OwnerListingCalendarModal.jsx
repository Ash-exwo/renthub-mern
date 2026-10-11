import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  Check,
  Ban,
  Trash2,
  Plus,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import api from "../utils/api";
import { formatYMD, parseYMD } from "./AvailabilityCalendarPicker";
import { Button, PriceDisplay } from "./ui";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OwnerListingCalendarModal({
  listingId,
  isOpen,
  onClose,
  onBookingStatusChanged,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Calendar month navigation
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Selected reservation details drawer / inspection
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Blackout dates creation form state
  const [showAddBlackout, setShowAddBlackout] = useState(false);
  const [blackoutStart, setBlackoutStart] = useState("");
  const [blackoutEnd, setBlackoutEnd] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");
  const [blackoutError, setBlackoutError] = useState("");
  const [blackoutSubmitting, setBlackoutSubmitting] = useState(false);

  // Fetch calendar data for listing
  const fetchCalendarData = async () => {
    if (!listingId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/bookings/listing/${listingId}/owner-calendar`);
      setData(res.data);
    } catch (err) {
      console.error("fetchCalendarData error:", err);
      setError(
        err.response?.data?.message || "Failed to load listing availability calendar."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && listingId) {
      fetchCalendarData();
      setSelectedBooking(null);
      setShowAddBlackout(false);
    }
  }, [isOpen, listingId]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Map each date YYYY-MM-DD to its bookings and blackouts
  const dateEventsMap = useMemo(() => {
    const map = new Map();
    if (!data) return map;

    // 1. Process Bookings
    (data.bookings || []).forEach((booking) => {
      if (!booking.startDate || !booking.endDate) return;
      if (booking.status === "cancelled" || booking.status === "rejected") return;

      const start = parseYMD(formatYMD(new Date(booking.startDate)));
      const end = parseYMD(formatYMD(new Date(booking.endDate)));
      if (!start || !end) return;

      let curr = new Date(start);
      while (curr < end) {
        const ymd = formatYMD(curr);
        if (!map.has(ymd)) map.set(ymd, []);
        map.get(ymd).push({
          type: "booking",
          booking,
          isFirstDay: ymd === formatYMD(start),
          isLastDay: ymd === formatYMD(new Date(end.getTime() - 86400000)),
        });
        curr.setDate(curr.getDate() + 1);
      }
    });

    // 2. Process Blackouts
    (data.blockedDates || []).forEach((blackout) => {
      const start = parseYMD(formatYMD(new Date(blackout.startDate)));
      const end = parseYMD(formatYMD(new Date(blackout.endDate)));
      if (!start || !end) return;

      let curr = new Date(start);
      while (curr < end) {
        const ymd = formatYMD(curr);
        if (!map.has(ymd)) map.set(ymd, []);
        map.get(ymd).push({
          type: "blackout",
          blackout,
          isFirstDay: ymd === formatYMD(start),
        });
        curr.setDate(curr.getDate() + 1);
      }
    });

    return map;
  }, [data]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayYMD = formatYMD(new Date());

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ blank: true, key: `blank-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const ymd = formatYMD(dateObj);
      const events = dateEventsMap.get(ymd) || [];

      days.push({
        blank: false,
        dayNum: d,
        ymd,
        isToday: ymd === todayYMD,
        events,
        key: ymd,
      });
    }

    return days;
  }, [currentYear, currentMonth, dateEventsMap]);

  // Status transition handlers (Accept, Decline, Complete)
  const handleUpdateStatus = async (bookingId, nextStatus, rejectionReason = "") => {
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status: nextStatus,
        rejectionReason,
      });
      await fetchCalendarData();
      setSelectedBooking(null);
      if (onBookingStatusChanged) onBookingStatusChanged();
    } catch (err) {
      alert(
        err.response?.data?.message || `Failed to update status to ${nextStatus}.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Add blackout date
  const handleAddBlackout = async (e) => {
    e.preventDefault();
    if (!blackoutStart || !blackoutEnd) {
      setBlackoutError("Please select both start date and end date.");
      return;
    }
    setBlackoutError("");
    setBlackoutSubmitting(true);
    try {
      await api.post(`/bookings/listing/${listingId}/blocked-dates`, {
        startDate: blackoutStart,
        endDate: blackoutEnd,
        reason: blackoutReason || "Personal Use / Maintenance",
      });
      setBlackoutStart("");
      setBlackoutEnd("");
      setBlackoutReason("");
      setShowAddBlackout(false);
      await fetchCalendarData();
    } catch (err) {
      setBlackoutError(
        err.response?.data?.message || "Failed to add blackout dates."
      );
    } finally {
      setBlackoutSubmitting(false);
    }
  };

  // Delete blackout date
  const handleDeleteBlackout = async (dateId) => {
    if (!window.confirm("Remove this blackout period and make dates available again?"))
      return;
    try {
      await api.delete(`/bookings/listing/${listingId}/blocked-dates/${dateId}`);
      await fetchCalendarData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove blackout date.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)] flex items-center justify-between gap-4 bg-[var(--color-surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {data?.listing?.images?.[0] ? (
              <img
                src={data.listing.images[0]}
                alt={data.listing.title}
                className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-[var(--color-border)] shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 grid place-items-center shrink-0">
                <CalendarDays size={22} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg text-[var(--color-espresso)] truncate">
                  {data?.listing?.title || "Listing Availability Calendar"}
                </h2>
                {data?.listing && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                    ₹{data.listing.rentalPricePerDay}/day
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-muted-grey)] mt-0.5 truncate">
                Real-time booking schedule &amp; maintenance blackouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddBlackout((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Blackout Dates</span>
              <span className="sm:hidden">Block</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[var(--color-muted-grey)]">
                Loading listing calendar...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-600 text-sm font-semibold">
              {error}
            </div>
          ) : (
            <>
              {/* Blackout Date Creation Panel (Collapsible) */}
              {showAddBlackout && (
                <form
                  onSubmit={handleAddBlackout}
                  className="p-4 sm:p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-purple-600" />
                      <h4 className="font-extrabold text-sm text-[var(--color-espresso)]">
                        Block Custom Dates for Maintenance or Personal Use
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBlackout(false)}
                      className="text-xs text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        min={formatYMD(new Date())}
                        value={blackoutStart}
                        onChange={(e) => setBlackoutStart(e.target.value)}
                        required
                        className="w-full p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        min={blackoutStart || formatYMD(new Date())}
                        value={blackoutEnd}
                        onChange={(e) => setBlackoutEnd(e.target.value)}
                        required
                        className="w-full p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                        Reason (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lens Service, Personal Trip"
                        value={blackoutReason}
                        onChange={(e) => setBlackoutReason(e.target.value)}
                        className="w-full p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                      />
                    </div>
                  </div>

                  {blackoutError && (
                    <div className="text-xs font-medium text-rose-600 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>{blackoutError}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={blackoutSubmitting}
                    >
                      Save Blackout Dates
                    </Button>
                  </div>
                </form>
              )}

              {/* Calendar Month Navigation Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-lg sm:text-xl text-[var(--color-espresso)]">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-espresso)]"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-espresso)]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Legend Indicators */}
                <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Confirmed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Blackout</span>
                  </span>
                </div>
              </div>

              {/* Month Grid */}
              <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-[var(--color-surface)] shadow-sm">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-center">
                  {DAY_LABELS.map((d) => (
                    <div
                      key={d}
                      className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)]"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days matrix */}
                <div className="grid grid-cols-7 divide-x divide-y divide-[var(--color-border)]">
                  {calendarDays.map((day) => {
                    if (day.blank) {
                      return (
                        <div
                          key={day.key}
                          className="min-h-[72px] sm:min-h-[88px] bg-[var(--color-surface-secondary)]/30"
                        />
                      );
                    }

                    const { dayNum, isToday, events } = day;

                    return (
                      <div
                        key={day.key}
                        className={`min-h-[72px] sm:min-h-[88px] p-1 sm:p-1.5 flex flex-col transition-colors ${
                          isToday ? "bg-indigo-500/5 font-extrabold" : ""
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                              isToday
                                ? "bg-indigo-600 text-white"
                                : "text-[var(--color-espresso)]"
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>

                        {/* Events list for this day */}
                        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                          {events.map((ev, idx) => {
                            if (ev.type === "booking") {
                              const b = ev.booking;
                              const isPending = b.status === "pending";
                              const isConfirmed = b.status === "confirmed";

                              let chipColor =
                                "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20";
                              if (isPending) {
                                chipColor =
                                  "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25";
                              } else if (isConfirmed) {
                                chipColor =
                                  "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25";
                              }

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedBooking(b)}
                                  className={`w-full text-left p-1 rounded-lg text-[10px] font-bold border truncate cursor-pointer transition-all ${chipColor}`}
                                >
                                  <div className="truncate">
                                    {isPending ? "🟡 " : isConfirmed ? "🟢 " : "⚪ "}
                                    {b.renter?.name || "Renter"}
                                  </div>
                                </button>
                              );
                            }

                            if (ev.type === "blackout") {
                              const bl = ev.blackout;
                              return (
                                <div
                                  key={idx}
                                  className="w-full text-left p-1 rounded-lg text-[10px] font-bold bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 truncate flex items-center justify-between group"
                                >
                                  <span className="truncate">
                                    🟣 {bl.reason || "Maintenance"}
                                  </span>
                                  {ev.isFirstDay && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBlackout(bl._id)}
                                      title="Remove blackout"
                                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity ml-1"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Booking Drawer / Details Card */}
              {selectedBooking && (
                <div className="p-4 sm:p-6 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            selectedBooking.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : selectedBooking.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                          }`}
                        >
                          {selectedBooking.status}
                        </span>
                        <h4 className="font-extrabold text-base text-[var(--color-espresso)]">
                          Reservation Details
                        </h4>
                      </div>
                      <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                        Booking ID: #{selectedBooking._id.slice(-6).toUpperCase()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBooking(null)}
                      className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-muted-grey)]"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-5">
                    {/* Renter profile */}
                    <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] flex items-center gap-1.5">
                        <User size={13} className="text-indigo-600" />
                        <span>Renter Profile</span>
                      </div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">
                        {selectedBooking.renter?.name || "Guest Renter"}
                      </div>
                      <div className="text-[var(--color-secondary-text)] flex items-center gap-1.5 truncate">
                        <Mail size={12} className="shrink-0" />
                        <span>{selectedBooking.renter?.email || "No email"}</span>
                      </div>
                      {selectedBooking.renter?.phone && (
                        <div className="text-[var(--color-secondary-text)] flex items-center gap-1.5">
                          <Phone size={12} className="shrink-0" />
                          <span>{selectedBooking.renter.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Rental Period */}
                    <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] flex items-center gap-1.5">
                        <Clock size={13} className="text-indigo-600" />
                        <span>Rental Period</span>
                      </div>
                      <div className="font-extrabold text-sm text-[var(--color-espresso)]">
                        {new Date(selectedBooking.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        &rarr;{" "}
                        {new Date(selectedBooking.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-[var(--color-secondary-text)] font-semibold">
                        {selectedBooking.days} {selectedBooking.days === 1 ? "day" : "days"} duration
                      </div>
                      {selectedBooking.notes && (
                        <div className="text-[11px] text-[var(--color-muted-grey)] italic border-t border-[var(--color-border)] pt-1">
                          &ldquo;{selectedBooking.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Payout & Earnings */}
                    <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        <span>Financial Summary</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--color-muted-grey)]">Daily Rate:</span>
                        <span className="font-semibold text-[var(--color-espresso)]">
                          ₹{selectedBooking.dailyRate}/day
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--color-muted-grey)]">Security Deposit:</span>
                        <span className="font-semibold text-[var(--color-espresso)]">
                          ₹{selectedBooking.deposit || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-1">
                        <span className="font-bold text-[var(--color-espresso)]">Total Paid:</span>
                        <span className="font-extrabold text-sm text-emerald-600">
                          ₹{selectedBooking.totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar for Owner */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                    {selectedBooking.status === "pending" && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Ban}
                          loading={actionLoading}
                          onClick={() => handleUpdateStatus(selectedBooking._id, "rejected")}
                        >
                          Decline Request
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Check}
                          loading={actionLoading}
                          onClick={() => handleUpdateStatus(selectedBooking._id, "confirmed")}
                        >
                          Accept &amp; Confirm Booking
                        </Button>
                      </>
                    )}

                    {selectedBooking.status === "confirmed" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Check}
                        loading={actionLoading}
                        onClick={() => handleUpdateStatus(selectedBooking._id, "completed")}
                      >
                        Mark Rental as Completed
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
