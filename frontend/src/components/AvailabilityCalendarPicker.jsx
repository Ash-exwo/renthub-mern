import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatYMD(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to local midnight Date
 */
export function parseYMD(ymdStr) {
  if (!ymdStr) return null;
  const [y, m, d] = ymdStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

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

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function AvailabilityCalendarPicker({
  startDate,
  endDate,
  onChange,
  bookedRanges = [],
  minDate,
  className = "",
}) {
  const todayYMD = useMemo(() => formatYMD(new Date()), []);
  const effectiveMinYMD = minDate || todayYMD;

  // Track the current visible month & year
  const initialDate = parseYMD(startDate) || parseYMD(effectiveMinYMD) || new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-11

  // Hover state for range preview
  const [hoverDateYMD, setHoverDateYMD] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Map of blocked dates for fast O(1) lookups: 'YYYY-MM-DD' => { type, status, reason }
  const blockedDatesMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(bookedRanges)) return map;

    bookedRanges.forEach((range) => {
      if (!range.startDate || !range.endDate) return;
      const start = parseYMD(formatYMD(new Date(range.startDate)));
      const end = parseYMD(formatYMD(new Date(range.endDate)));
      if (!start || !end) return;

      // Rental convention: start date up to day before end date is occupied
      // (On the end date morning, item is returned and available for next checkout)
      let curr = new Date(start);
      while (curr < end) {
        const ymd = formatYMD(curr);
        map.set(ymd, {
          type: range.type || "booking",
          status: range.status,
          reason: range.reason,
        });
        curr.setDate(curr.getDate() + 1);
      }
    });

    return map;
  }, [bookedRanges]);

  // Navigate to previous month (do not go earlier than current month)
  const canGoPrev = useMemo(() => {
    const today = new Date();
    return (
      currentYear > today.getFullYear() ||
      (currentYear === today.getFullYear() && currentMonth > today.getMonth())
    );
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
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

  // Build the calendar matrix for the active month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    // Leading blank slots from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ blank: true, key: `blank-${i}` });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const ymd = formatYMD(dateObj);
      const isPast = ymd < effectiveMinYMD;
      const blockInfo = blockedDatesMap.get(ymd);
      const isBlocked = !!blockInfo;

      days.push({
        blank: false,
        dayNum: d,
        ymd,
        isPast,
        isBlocked,
        blockInfo,
        key: ymd,
      });
    }

    return days;
  }, [currentYear, currentMonth, effectiveMinYMD, blockedDatesMap]);

  // Helper to check if a range spans any blocked date
  const rangeHasBlockedDates = (fromYMD, toYMD) => {
    let curr = parseYMD(fromYMD);
    const end = parseYMD(toYMD);
    if (!curr || !end) return false;

    while (curr < end) {
      const ymd = formatYMD(curr);
      if (blockedDatesMap.has(ymd)) {
        return true;
      }
      curr.setDate(curr.getDate() + 1);
    }
    return false;
  };

  // Handle day click
  const handleDayClick = (day) => {
    if (day.blank || day.isPast || day.isBlocked) return;
    setErrorMessage("");

    const clickedYMD = day.ymd;

    // State 1: No startDate chosen, or both dates were already selected -> Start fresh
    if (!startDate || (startDate && endDate)) {
      onChange({ startDate: clickedYMD, endDate: "" });
      return;
    }

    // State 2: startDate is already selected, picking endDate
    if (startDate && !endDate) {
      // If clicking an earlier date, restart range from this earlier date
      if (clickedYMD < startDate) {
        onChange({ startDate: clickedYMD, endDate: "" });
        return;
      }

      // If clicking the same day, set minimum 1-day rental (start day + 1)
      if (clickedYMD === startDate) {
        const nextDay = new Date(parseYMD(clickedYMD));
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayYMD = formatYMD(nextDay);

        if (rangeHasBlockedDates(clickedYMD, nextDayYMD)) {
          setErrorMessage("Cannot book 1 day here: next day is already reserved.");
          return;
        }

        onChange({ startDate: clickedYMD, endDate: nextDayYMD });
        return;
      }

      // Clicking a future date: check if any day in the range is blocked
      if (rangeHasBlockedDates(startDate, clickedYMD)) {
        setErrorMessage(
          "Your selected date range spans across already reserved dates. Please select an uninterrupted period."
        );
        return;
      }

      onChange({ startDate, endDate: clickedYMD });
    }
  };

  // Quick reset
  const handleClear = () => {
    setErrorMessage("");
    onChange({ startDate: "", endDate: "" });
  };

  // Calculate rental duration in days
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = parseYMD(startDate);
    const e = parseYMD(endDate);
    if (!s || !e || e <= s) return 0;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 shadow-sm select-none ${className}`}
    >
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm sm:text-base text-[var(--color-espresso)]">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            aria-label="Previous month"
            className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[var(--color-espresso)]"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-espresso)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_LABELS.map((day, idx) => (
          <span
            key={idx}
            className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] py-1"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div
        className="grid grid-cols-7 gap-1"
        onMouseLeave={() => setHoverDateYMD(null)}
      >
        {calendarDays.map((day) => {
          if (day.blank) {
            return <div key={day.key} className="h-9 w-full" />;
          }

          const { ymd, dayNum, isPast, isBlocked, blockInfo } = day;

          const isStart = ymd === startDate;
          const isEnd = ymd === endDate;
          const isSelectedExact = isStart || isEnd;

          // Inside selected range
          const isInSelectedRange =
            startDate && endDate && ymd > startDate && ymd < endDate;

          // Inside hover preview range
          const isHoverPreview =
            startDate &&
            !endDate &&
            hoverDateYMD &&
            hoverDateYMD > startDate &&
            ymd > startDate &&
            ymd <= hoverDateYMD &&
            !isBlocked;

          // Check if hover preview is invalid because it crosses blocked dates
          const isHoverInvalid =
            isHoverPreview && rangeHasBlockedDates(startDate, hoverDateYMD);

          let cellClass =
            "relative h-9 w-full flex items-center justify-center text-xs font-semibold rounded-xl transition-all ";

          if (isPast) {
            cellClass +=
              "text-gray-300 dark:text-gray-600 cursor-not-allowed line-through";
          } else if (isBlocked) {
            const isBlackout = blockInfo?.type === "blackout";
            cellClass += isBlackout
              ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 cursor-not-allowed line-through"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 cursor-not-allowed line-through";
          } else if (isSelectedExact) {
            cellClass +=
              "bg-indigo-600 text-white font-extrabold shadow-md scale-105 z-10";
          } else if (isInSelectedRange) {
            cellClass +=
              "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold rounded-none first:rounded-l-xl last:rounded-r-xl";
          } else if (isHoverPreview) {
            cellClass += isHoverInvalid
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300";
          } else {
            cellClass +=
              "text-[var(--color-espresso)] hover:bg-indigo-500/10 hover:text-indigo-600 cursor-pointer";
          }

          // Tooltip title
          let titleText = `Date: ${ymd}`;
          if (isBlocked) {
            titleText =
              blockInfo?.type === "blackout"
                ? `Unavailable: ${blockInfo?.reason || "Maintenance"}`
                : `Already Booked (${blockInfo?.status || "Reserved"})`;
          }

          return (
            <button
              key={day.key}
              type="button"
              disabled={isPast || isBlocked}
              title={titleText}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => {
                if (startDate && !endDate && !isPast && !isBlocked) {
                  setHoverDateYMD(ymd);
                }
              }}
              className={cellClass}
            >
              <span>{dayNum}</span>

              {/* Status dot indicators */}
              {isBlocked && (
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    blockInfo?.type === "blackout" ? "bg-purple-500" : "bg-rose-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Error / Conflict Alert */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected Dates Summary Bar */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--color-muted-grey)] block">
              Check-in
            </span>
            <span className="font-extrabold text-[var(--color-espresso)]">
              {startDate
                ? new Date(startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : "Select"}
            </span>
          </div>

          <span className="text-gray-300 dark:text-gray-600">&rarr;</span>

          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--color-muted-grey)] block">
              Check-out
            </span>
            <span className="font-extrabold text-[var(--color-espresso)]">
              {endDate
                ? new Date(endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : "Select"}
            </span>
          </div>

          {durationDays > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] border border-indigo-500/20 inline-flex items-center gap-1">
              <CheckCircle2 size={12} />
              {durationDays} {durationDays === 1 ? "day" : "days"}
            </span>
          )}
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-[var(--color-muted-grey)] hover:text-rose-600 inline-flex items-center gap-1 font-semibold transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Visual Legend */}
      <div className="mt-3 pt-2 border-t border-dashed border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-muted-grey)] font-medium flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Maintenance</span>
        </div>
      </div>
    </div>
  );
}
