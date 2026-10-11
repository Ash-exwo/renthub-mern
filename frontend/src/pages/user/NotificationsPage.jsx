import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Calendar,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Check,
} from "lucide-react";
import Container from "../../components/Container";
import { Button, Tabs } from "../../components/ui";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("renthub_user_notifications") || "[]");
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All", count: notifications.length },
    { id: "Bookings", label: "Bookings" },
    { id: "Payments", label: "Payments" },
    { id: "Messages", label: "Messages" },
    { id: "System", label: "System" },
  ];

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeTab);

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem("renthub_user_notifications", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleMarkSingleRead = (id) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    try {
      localStorage.setItem("renthub_user_notifications", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
            <div>
              <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)] m-0">
                Notifications
              </h1>
              <p className="text-sm text-[var(--color-muted-grey)] mt-1 mb-0">
                Platform updates, booking receipts, and host messages.
              </p>
            </div>

            {notifications.length > 0 && (
              <Button variant="outline" size="sm" icon={Check} onClick={handleMarkAllRead}>
                Mark all as read
              </Button>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="mb-6">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm">
              <Bell size={36} className="mx-auto text-[var(--color-muted-grey)] mb-3 opacity-40" />
              <h3 className="font-bold text-base text-[var(--color-espresso)]">No Notifications Yet</h3>
              <p className="text-xs text-[var(--color-muted-grey)] mt-1 max-w-sm mx-auto">
                You're all caught up! Reservation updates, escrow notifications, and host messages will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {filtered.map((item) => {
                const Icon = item.icon || Bell;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkSingleRead(item.id)}
                    className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer relative flex items-start gap-4 ${
                      item.read
                        ? "bg-[var(--color-surface)] border-[var(--color-border)]"
                        : "bg-[var(--color-surface-subtle)] border-indigo-500/30 shadow-sm"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className={`text-sm ${item.read ? "font-semibold text-[var(--color-espresso)]" : "font-bold text-[var(--color-espresso)]"}`}>
                          {item.title}
                        </span>
                        <span className="text-xs text-[var(--color-muted-grey)]">
                          {item.time}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--color-secondary-text)] leading-relaxed mb-2">
                        {item.desc}
                      </p>

                      {item.link && (
                        <Link
                          to={item.link}
                          className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1"
                        >
                          View details &rarr;
                        </Link>
                      )}
                    </div>

                    {!item.read && (
                      <span className="absolute top-5 right-4 w-2 h-2 rounded-full bg-[var(--color-brand-primary)]" />
                    )}
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
