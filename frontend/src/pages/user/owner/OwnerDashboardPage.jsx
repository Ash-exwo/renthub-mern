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
} from "lucide-react";
import api from "../../../utils/api";
import { getUser } from "../../../utils/auth";
import Container from "../../../components/Container";
import {
  Button,
  Card,
  StatusBadge,
} from "../../../components/ui";

const INITIAL_REQUESTS = [
  {
    id: "REQ-101",
    listing: "Sony FX3 Cinema Camera + G-Master 24-70mm Kit",
    renter: "Karthik Raja",
    dates: "2026-09-28 to 2026-10-01 (3 days)",
    amount: 7200,
    deposit: 8000,
    status: "Pending",
  },
  {
    id: "REQ-102",
    listing: "Panoramic Sea-View 2BHK Luxury Apartment",
    renter: "Pooja Hegde",
    dates: "2026-10-05 to 2026-10-09 (4 days)",
    amount: 12800,
    deposit: 5000,
    status: "Pending",
  },
];

export default function OwnerDashboardPage() {
  const user = getUser();

  const [myListingsCount, setMyListingsCount] = useState(3);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/listings/my-listings");
        if (res.data?.listings) {
          setMyListingsCount(res.data.listings.length);
        }
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleAction = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
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

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
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
            <div className="text-xs text-emerald-600 font-semibold mt-3">
              100% operational
            </div>
          </Card>

          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">This Month's Payout</span>
                <h3 className="text-3xl font-extrabold text-[var(--color-espresso)] mt-1">
                  ₹28,400
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-xs text-[var(--color-muted-grey)] mt-3">
              Next transfer on Oct 1
            </div>
          </Card>

          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Pending Inquiries</span>
                <h3 className="text-3xl font-extrabold text-[var(--color-espresso)] mt-1">
                  {requests.filter((r) => r.status === "Pending").length}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 grid place-items-center">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-xs text-cyan-600 font-semibold mt-3">
              Requires response
            </div>
          </Card>

          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Host Rating</span>
                <h3 className="text-3xl font-extrabold text-[var(--color-espresso)] mt-1">
                  4.95 ★
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
                <Star size={20} />
              </div>
            </div>
            <div className="text-xs text-[var(--color-muted-grey)] mt-3">
              Based on 34 verified reviews
            </div>
          </Card>
        </div>

        {/* Pending Booking Inquiries */}
        <Card padding="lg" className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-espresso)]">Pending Rental Requests</h2>
              <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                Review and approve or reject renter requests.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className={`border border-[var(--color-border-subtle)] rounded-xl p-4 sm:p-5 flex justify-between items-center flex-wrap gap-4 ${
                  req.status === "Pending" ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-subtle)]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--color-espresso)]">{req.listing}</span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                  <div className="text-xs text-[var(--color-muted-grey)] mt-1">
                    Renter: <strong className="text-[var(--color-espresso)]">{req.renter}</strong> · {req.dates}
                  </div>
                  <div className="text-xs text-[var(--color-secondary-text)] mt-0.5">
                    Rental payout: <strong className="text-[var(--color-espresso)]">₹{req.amount.toLocaleString("en-IN")}</strong> · Security deposit: ₹{req.deposit.toLocaleString("en-IN")}
                  </div>
                </div>

                {req.status === "Pending" ? (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleAction(req.id, "Approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={X}
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleAction(req.id, "Declined")}
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  <div className={`text-xs font-bold ${req.status === "Approved" ? "text-emerald-600" : "text-red-600"}`}>
                    {req.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </div>
  );
}
