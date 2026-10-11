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

export default function OwnerDashboardPage() {
  const user = getUser();

  const [myListingsCount, setMyListingsCount] = useState(0);
  const [requests, setRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("renthub_owner_requests") || "[]");
    } catch {
      return [];
    }
  });
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
    const updated = requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
    setRequests(updated);
    try {
      localStorage.setItem("renthub_owner_requests", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "Pending").length;
  const approvedTotalRevenue = requests
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

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
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Total Earnings</span>
                <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                  ₹{approvedTotalRevenue.toLocaleString("en-IN")}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-xs text-[var(--color-muted-grey)] mt-3">
              Approved rental bookings
            </div>
          </Card>

          <Card padding="md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-grey)]">Pending Inquiries</span>
                <h3 className="text-3xl font-extrabold text-cyan-600 mt-1">
                  {pendingRequestsCount}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 grid place-items-center">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-xs text-cyan-600 font-semibold mt-3">
              {pendingRequestsCount > 0 ? "Requires response" : "All caught up"}
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

        {/* Pending Booking Inquiries */}
        <Card padding="lg" className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-espresso)]">Pending Rental Requests</h2>
              <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                Review and approve or decline incoming renter requests.
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface-subtle)]">
              <Clock size={32} className="mx-auto text-[var(--color-muted-grey)] mb-2 opacity-40" />
              <h3 className="font-bold text-sm text-[var(--color-espresso)]">No Rental Requests Yet</h3>
              <p className="text-xs text-[var(--color-muted-grey)] mt-1 max-w-sm mx-auto">
                When renters place a reservation request on your listings, their inquiries will appear here for your review and approval.
              </p>
            </div>
          ) : (
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
          )}
        </Card>
      </Container>
    </div>
  );
}
