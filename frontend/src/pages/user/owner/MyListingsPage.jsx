import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
  MapPin,
} from "lucide-react";
import api from "../../../utils/api";
import Container from "../../../components/Container";
import {
  Button,
  Card,
  Input,
  StatusBadge,
  Badge,
  EmptyState,
} from "../../../components/ui";

export default function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchMyListings() {
      try {
        const res = await api.get("/listings/my-listings");
        if (res.data?.listings) {
          setListings(res.data.listings);
        } else {
          setListings([]);
        }
      } catch (err) {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMyListings();
  }, []);

  const handleToggleAvailability = async (id) => {
    const current = listings.find((item) => (item._id || item.id) === id);
    const nextAvailability = current?.availability === "available" ? "unavailable" : "available";
    const nextActive = nextAvailability === "available";

    // Optimistic UI update
    setListings((prev) =>
      prev.map((item) => {
        const itemId = item._id || item.id;
        if (itemId === id) {
          return { ...item, availability: nextAvailability, isActive: nextActive };
        }
        return item;
      })
    );

    try {
      await api.patch(`/listings/${id}/status`, {
        isActive: nextActive,
        availability: nextAvailability,
      });
    } catch (err) {
      console.error("Failed to toggle listing status:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      console.error("Failed to delete listing on server:", err);
      setListings((prev) => prev.filter((item) => (item._id || item.id) !== id));
    }
  };

  const filtered = listings.filter((item) => {
    if (search.trim()) {
      if (!item.title.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (statusFilter !== "all") {
      if (item.availability !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        {/* Header Title & CTA */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[var(--color-terracotta)] uppercase tracking-wider">
              Asset Inventory
            </span>
            <h1 className="font-[var(--font-heading)] text-2xl sm:text-4xl font-extrabold text-[var(--color-espresso)] mt-1">
              My Listings
            </h1>
            <p className="text-sm text-[var(--color-muted-grey)] mt-1">
              Manage availability, edit pricing, and view your published rental catalog.
            </p>
          </div>

          <Link to="/listings/new">
            <Button variant="primary" icon={Plus}>
              Create New Listing
            </Button>
          </Link>
        </div>

        {/* Filters Toolbar */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <div className="w-full max-w-xs">
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefixIcon={Search}
            />
          </div>

          <div className="flex gap-2">
            {["all", "available", "unavailable"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
              >
                {st === "all" ? "All" : st === "available" ? "Active" : "Paused"}
              </Button>
            ))}
          </div>
        </div>

        {/* Listings List */}
        {loading ? (
          <p className="text-sm text-[var(--color-muted-grey)]">Loading your listings...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No listings found"
            description="You don't have any listings matching your search criteria."
            actionLabel="Publish a Listing"
            onAction={() => (window.location.href = "/listings/new")}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((item) => {
              const itemId = item._id || item.id;
              const catName =
                typeof item.category === "object" && item.category !== null
                  ? item.category.name
                  : item.category;
              const catIcon =
                typeof item.category === "object" && item.category !== null
                  ? item.category.icon
                  : null;
              const img =
                item.images && item.images.length > 0
                  ? item.images[0]
                  : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800";

              return (
                <Card key={itemId} padding="md">
                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-5 items-center">
                    <img
                      src={img}
                      alt={item.title}
                      className="w-full sm:w-24 h-24 object-cover rounded-xl"
                    />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" size="sm">
                          {catIcon && <span className="mr-1">{catIcon}</span>}
                          {catName}
                        </Badge>
                        <StatusBadge status={item.availability || "available"} size="sm" />
                      </div>

                      <h3 className="text-base font-bold text-[var(--color-espresso)] mb-1">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-muted-grey)]">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-[var(--color-terracotta)]" />
                          <span>{item.location}</span>
                        </div>
                        <div>
                          Daily Rate: <strong className="text-[var(--color-espresso)]">₹{Number(item.rentalPricePerDay).toLocaleString("en-IN")}/day</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">
                      <Link to={`/listings/${itemId}`}>
                        <Button variant="outline" size="sm" icon={Eye}>
                          View
                        </Button>
                      </Link>

                      <Link to={`/listings/${itemId}/edit`}>
                        <Button variant="outline" size="sm" icon={Pencil}>
                          Edit
                        </Button>
                      </Link>

                      <Button
                        variant={item.availability === "available" ? "ghost" : "secondary"}
                        size="sm"
                        icon={item.availability === "available" ? PauseCircle : PlayCircle}
                        onClick={() => handleToggleAvailability(itemId)}
                      >
                        {item.availability === "available" ? "Pause" : "Activate"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(itemId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
