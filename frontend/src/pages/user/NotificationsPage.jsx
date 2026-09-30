import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Calendar,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Check,
  CheckCircle2,
} from "lucide-react";
import Container from "../../components/Container";
import { Button, Card, Badge, Tabs } from "../../components/ui";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    category: "Bookings",
    icon: Calendar,
    title: "Reservation Confirmed",
    desc: "Your booking for Sony FX3 Camera Kit from Sep 25 - 28 is approved by Rahul Nair.",
    time: "25m ago",
    read: false,
    link: "/bookings",
  },
  {
    id: "notif-2",
    category: "Payments",
    icon: CreditCard,
    title: "Security Deposit Protected",
    desc: "₹5,000 security deposit for Sea-View 2BHK is safely held in digital escrow.",
    time: "2h ago",
    read: false,
    link: "/bookings",
  },
  {
    id: "notif-3",
    category: "Messages",
    icon: MessageSquare,
    title: "New Message from Aswathy",
    desc: "'Keys are in the lockbox. Code is 4829.'",
    time: "Yesterday",
    read: true,
    link: "/messages",
  },
  {
    id: "notif-4",
    category: "System",
    icon: ShieldCheck,
    title: "Profile Identity Verified",
    desc: "Your government ID verification passed. You now carry the Verified Member badge.",
    time: "3 days ago",
    read: true,
    link: "/profile",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkSingleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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

            <Button variant="outline" size="sm" icon={Check} onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          </div>

          <div className="mb-6">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
          </div>

          <div className="flex flex-col gap-3.5">
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkSingleRead(item.id)}
                  className={`p-4 sm:p-5 rounded-lg border transition-all cursor-pointer relative flex items-start gap-4 ${
                    item.read
                      ? "bg-[var(--color-surface)] border-[var(--color-border)]"
                      : "bg-[var(--color-surface-subtle)] border-[var(--color-border)] shadow-sm"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-terracotta)] flex items-center justify-center shrink-0">
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

                    <Link
                      to={item.link}
                      className="text-xs font-semibold text-[var(--color-terracotta)] hover:underline inline-flex items-center gap-1"
                    >
                      View details &rarr;
                    </Link>
                  </div>

                  {!item.read && (
                    <span className="absolute top-5 right-4 w-2 h-2 rounded-full bg-[var(--color-terracotta)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
