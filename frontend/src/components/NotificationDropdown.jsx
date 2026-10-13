import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Star,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  MessageSquare,
} from "lucide-react";
import api from "../utils/api";
import { isLoggedIn } from "../utils/auth";

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const now = new Date();
    const date = new Date(dateStr);
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // Helper to pick type-specific icon and color theme
  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking_request":
        return {
          icon: Clock,
          bg: "bg-amber-500/10",
          color: "text-amber-600 dark:text-amber-400",
        };
      case "booking_confirmed":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-500/10",
          color: "text-emerald-600 dark:text-emerald-400",
        };
      case "booking_rejected":
        return {
          icon: XCircle,
          bg: "bg-rose-500/10",
          color: "text-rose-600 dark:text-rose-400",
        };
      case "booking_cancelled":
        return {
          icon: AlertTriangle,
          bg: "bg-rose-500/10",
          color: "text-rose-600 dark:text-rose-400",
        };
      case "payment_escrow_funded":
        return {
          icon: ShieldCheck,
          bg: "bg-indigo-500/10",
          color: "text-indigo-600 dark:text-indigo-400",
        };
      case "rental_completed":
        return {
          icon: Star,
          bg: "bg-purple-500/10",
          color: "text-purple-600 dark:text-purple-400",
        };
      case "payout_released":
        return {
          icon: CreditCard,
          bg: "bg-emerald-500/10",
          color: "text-emerald-600 dark:text-emerald-400",
        };
      case "review_received":
        return {
          icon: Star,
          bg: "bg-amber-500/10",
          color: "text-amber-500 dark:text-amber-400",
        };
      case "new_message":
        return {
          icon: MessageSquare,
          bg: "bg-blue-500/10",
          color: "text-blue-600 dark:text-blue-400",
        };
      default:
        return {
          icon: Bell,
          bg: "bg-blue-500/10",
          color: "text-blue-600 dark:text-blue-400",
        };
    }
  };

  // Fetch unread count lightweight
  const fetchUnreadCount = async () => {
    if (!loggedIn) return;
    try {
      const res = await api.get("/notifications/unread-count");
      if (res.data && typeof res.data.unreadCount === "number") {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  // Fetch full list of notifications when dropdown opens
  const fetchNotifications = async () => {
    if (!loggedIn) return;
    setLoading(true);
    try {
      const res = await api.get("/notifications?limit=20");
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll unread count periodically (every 20s) and on tab focus
  useEffect(() => {
    if (!loggedIn) return;
    fetchUnreadCount();

    const handleFocus = () => fetchUnreadCount();
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(fetchUnreadCount, 20000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [loggedIn]);

  // Handle open/close dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single notification as read & navigate to target link
  const handleItemClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }

    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Delete a single notification
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const deletedItem = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  if (!loggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`relative p-2 rounded-full cursor-pointer transition-colors ${
          isOpen
            ? "text-[var(--color-brand-primary)] bg-[var(--color-surface-hover)]"
            : "text-[var(--color-secondary-text)] hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)]"
        }`}
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] leading-tight flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] w-[360px] sm:w-[400px] max-w-[90vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-secondary)]/50">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-[var(--color-espresso)] m-0">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Check size={13} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
            {loading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-[var(--color-muted-grey)]">
                  Loading notifications...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 grid place-items-center mx-auto mb-2 opacity-70">
                  <Bell size={22} />
                </div>
                <h5 className="font-bold text-xs text-[var(--color-espresso)]">
                  All Caught Up!
                </h5>
                <p className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 max-w-xs mx-auto">
                  New rental requests, booking approvals, and escrow updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon: Icon, bg, color } = getNotificationIcon(notif.type);
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 px-4 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                      notif.isRead
                        ? "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
                        : "bg-indigo-500/5 hover:bg-indigo-500/10"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl ${bg} ${color} grid place-items-center shrink-0 mt-0.5`}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h5
                          className={`text-xs truncate ${
                            notif.isRead
                              ? "font-semibold text-[var(--color-espresso)]"
                              : "font-extrabold text-[var(--color-espresso)]"
                          }`}
                        >
                          {notif.title}
                        </h5>
                        <span className="text-[10px] text-[var(--color-muted-grey)] shrink-0 font-medium">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--color-secondary-text)] line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Delete action button on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, notif._id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--color-muted-grey)] hover:text-rose-600 hover:bg-rose-500/10 transition-all shrink-0 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/30 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 py-0.5"
            >
              <span>View all notifications</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
