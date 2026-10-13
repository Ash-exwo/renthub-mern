import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Star,
  Check,
  Trash2,
  Loader2,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import Container from "../../components/Container";
import { Button, Tabs } from "../../components/ui";
import api from "../../utils/api";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/notifications?limit=100");
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await api.delete("/notifications/clear-all");
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const handleItemClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const unreadList = notifications.filter((n) => !n.isRead);
  const bookingsList = notifications.filter((n) => n.type.startsWith("booking") || n.type === "rental_completed");
  const paymentsList = notifications.filter((n) => n.type.startsWith("payment") || n.type === "payout_released");

  const tabs = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadList.length },
    { id: "bookings", label: "Bookings", count: bookingsList.length },
    { id: "payments", label: "Payments", count: paymentsList.length },
  ];

  const filtered = (() => {
    if (activeTab === "unread") return unreadList;
    if (activeTab === "bookings") return bookingsList;
    if (activeTab === "payments") return paymentsList;
    return notifications;
  })();

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)] m-0">
                  Notification Center
                </h1>
                {unreadList.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white shadow-sm">
                    {unreadList.length} new
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-muted-grey)] mt-1 mb-0">
                Live alerts for rental requests, confirmations, escrow holds, and completed returns.
              </p>
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadList.length > 0 && (
                  <Button variant="outline" size="sm" icon={Check} onClick={handleMarkAllRead}>
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
          </div>

          {/* Content */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-[var(--color-muted-grey)]">
                Loading notifications...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-sm font-semibold">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchNotifications}>
                Try Again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-sm">
              <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 text-indigo-600 grid place-items-center mx-auto mb-3">
                <Bell size={28} />
              </div>
              <h3 className="font-extrabold text-base text-[var(--color-espresso)]">
                {activeTab === "unread" ? "No Unread Notifications" : "No Notifications Yet"}
              </h3>
              <p className="text-xs text-[var(--color-muted-grey)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                {activeTab === "unread"
                  ? "You have reviewed all your alerts. When new activities happen, they'll show up here."
                  : "You're all caught up! Reservation updates, escrow transfers, and host messages will appear here."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((item) => {
                const { icon: Icon, bg, color } = getNotificationIcon(item.type);
                return (
                  <div
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-4 group ${
                      item.isRead
                        ? "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] shadow-xs"
                        : "bg-indigo-500/5 border-indigo-500/30 hover:bg-indigo-500/10 shadow-sm"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <span
                          className={`text-sm ${
                            item.isRead
                              ? "font-semibold text-[var(--color-espresso)]"
                              : "font-extrabold text-[var(--color-espresso)]"
                          }`}
                        >
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[var(--color-muted-grey)] font-medium">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                          {!item.isRead && (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shrink-0"
                              title="Unread notification"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, item._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[var(--color-muted-grey)] hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--color-secondary-text)] leading-relaxed mb-2.5">
                        {item.message}
                      </p>

                      {item.link && (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline inline-flex items-center gap-1">
                          <span>View Details &rarr;</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
