import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Building2,
  FolderTree,
  Flag,
  CheckCircle2,
  XCircle,
  BarChart3,
  Search,
  LogOut,
  Bell,
  Trash2,
  ShieldAlert,
  Clock,
  Plus,
  Check,
  X,
} from "lucide-react";

// Mock initial data
const INITIAL_STATS = [
  { id: 1, label: "Total Users", value: "1,248", change: "+12%", icon: Users, color: "#2563eb" },
  { id: 2, label: "Active Listings", value: "432", change: "+8%", icon: Building2, color: "#059669" },
  { id: 3, label: "Pending Approvals", value: "14", change: "Requires action", icon: Clock, color: "#d97706" },
  { id: 4, label: "Flagged Reports", value: "5", change: "-3%", icon: ShieldAlert, color: "#dc2626" },
];

const INITIAL_USERS = [
  { id: "u1", name: "Aswathy V", email: "aswathy@gmail.com", role: "Host", status: "Active", joined: "2026-02-10" },
  { id: "u2", name: "Rahul Nair", email: "rahul@gmail.com", role: "User", status: "Active", joined: "2026-03-01" },
  { id: "u3", name: "Sneha Kapoor", email: "sneha@gmail.com", role: "Host", status: "Suspended", joined: "2026-01-15" },
  { id: "u4", name: "John Doe", email: "john@gmail.com", role: "User", status: "Active", joined: "2026-03-12" },
];

const INITIAL_LISTINGS = [
  { id: "l1", title: "Luxury 2BHK Apartment", owner: "Aswathy V", category: "Apartments", price: "₹25,000/mo", status: "Approved" },
  { id: "l2", title: "DSLR Camera Kit", owner: "Rahul Nair", category: "Electronics", price: "₹1,200/day", status: "Pending" },
  { id: "l3", title: "Royal Enfield Classic 350", owner: "Sneha Kapoor", category: "Vehicles", price: "₹800/day", status: "Approved" },
  { id: "l4", title: "Beachfront Villa", owner: "John Doe", category: "Apartments", price: "₹15,000/day", status: "Flagged" },
];

const INITIAL_CATEGORIES = [
  { id: "c1", name: "Apartments & Villas", count: 184, icon: "🏠" },
  { id: "c2", name: "Vehicles & Bikes", count: 96, icon: "🚗" },
  { id: "c3", name: "Electronics & Gadgets", count: 72, icon: "📷" },
  { id: "c4", name: "Event & Party Supplies", count: 45, icon: "🎉" },
  { id: "c5", name: "Tools & Equipment", count: 35, icon: "🔧" },
];

const INITIAL_REPORTS = [
  { id: "r1", listing: "Beachfront Villa", reportedBy: "Rahul Nair", reason: "Misleading photos and inaccurate pricing", date: "2026-03-22", status: "Open" },
  { id: "r2", listing: "DSLR Camera Kit", reportedBy: "Sneha Kapoor", reason: "Unresponsive host", date: "2026-03-21", status: "Resolved" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("adminUser") || "null");

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState(INITIAL_USERS);
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const handleUserStatusToggle = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u))
    );
  };

  const handleListingAction = (id, newStatus) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
  };

  const handleDeleteListing = (id) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategories((prev) => [
      ...prev,
      { id: `c${Date.now()}`, name: newCatName.trim(), count: 0, icon: "📁" },
    ]);
    setNewCatName("");
    setShowAddCat(false);
  };

  const handleResolveReport = (id) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Resolved" } : r)));
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg, #f8fafc)",
        color: "var(--color-text, #0f172a)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "16rem",
          background: "#1e293b",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 1rem",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "2rem", paddingLeft: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.6 }}>
            RentHub Platform
          </span>
          <h2 style={{ fontSize: "1.25rem", margin: "0.2rem 0 0 0", fontWeight: 700, color: "var(--color-terracotta, #e05638)" }}>
            Admin Console
          </h2>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users Management", icon: Users },
            { id: "listings", label: "Listings Control", icon: Building2 },
            { id: "categories", label: "Categories", icon: FolderTree },
            { id: "reports", label: "Reports & Flags", icon: Flag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.7rem 0.85rem",
                  borderRadius: "var(--radius-sm, 6px)",
                  border: "none",
                  background: isActive ? "var(--color-terracotta, #e05638)" : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  cursor: "pointer",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.9rem",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.7rem 0.85rem",
            borderRadius: "var(--radius-sm, 6px)",
            border: "1px solid #334155",
            background: "transparent",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
            marginTop: "auto",
          }}
        >
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        {/* HEADER */}
        <header
          style={{
            height: "4rem",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 600 }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ position: "relative" }}>
              <Bell size={20} style={{ color: "#64748b", cursor: "pointer" }} />
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  background: "#dc2626",
                  borderRadius: "50%",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "2.2rem",
                  height: "2.2rem",
                  borderRadius: "50%",
                  background: "var(--color-terracotta, #e05638)",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {(admin?.username || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{admin?.username || "Admin"}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>System Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {/* BODY CONTENT */}
        <div style={{ padding: "2rem", flex: 1 }}>
          {(activeTab === "users" || activeTab === "listings") && (
            <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: "24rem" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem 0.6rem 2.5rem",
                    borderRadius: "var(--radius-sm, 6px)",
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1.25rem",
                  marginBottom: "2rem",
                }}
              >
                {INITIAL_STATS.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.id}
                      style={{
                        background: "#ffffff",
                        padding: "1.25rem",
                        borderRadius: "var(--radius-sm, 8px)",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{stat.label}</span>
                        <h3 style={{ fontSize: "1.6rem", margin: "0.25rem 0", fontWeight: 700 }}>
                          {stat.value}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: stat.color, fontWeight: 500 }}>
                          {stat.change}
                        </span>
                      </div>
                      <div
                        style={{
                          width: "3rem",
                          height: "3rem",
                          borderRadius: "12px",
                          background: `${stat.color}15`,
                          display: "grid",
                          placeItems: "center",
                          color: stat.color,
                        }}
                      >
                        <Icon size={22} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "1.5rem",
                    borderRadius: "var(--radius-sm, 8px)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 600 }}>
                    Pending Listing Approvals
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {listings
                      .filter((l) => l.status === "Pending")
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.75rem",
                            border: "1px solid #f1f5f9",
                            borderRadius: "6px",
                            background: "#fafafa",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.title}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                              By {item.owner} • {item.price}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => handleListingAction(item.id, "Approved")}
                              style={{
                                border: "none",
                                background: "#dcfce7",
                                color: "#15803d",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleListingAction(item.id, "Rejected")}
                              style={{
                                border: "none",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    {listings.filter((l) => l.status === "Pending").length === 0 && (
                      <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No pending listings.</p>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    padding: "1.5rem",
                    borderRadius: "var(--radius-sm, 8px)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 600 }}>
                    System Status
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "#64748b" }}>Logged in as</span>
                      <span style={{ fontWeight: 600 }}>{admin?.username || "Admin"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "#64748b" }}>Total Categories</span>
                      <span style={{ fontWeight: 600 }}>{categories.length}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "#64748b" }}>Open Reports</span>
                      <span style={{ fontWeight: 600, color: "#dc2626" }}>
                        {reports.filter((r) => r.status === "Open").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "var(--radius-sm, 8px)",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "0.825rem", color: "#64748b" }}>
                      <th style={{ padding: "0.85rem 1rem" }}>User</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Role</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Joined</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(
                        (u) =>
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" }}>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ fontWeight: 600 }}>{user.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{user.email}</div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>{user.role}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>{user.joined}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.6rem",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background: user.status === "Active" ? "#dcfce7" : "#fee2e2",
                                color: user.status === "Active" ? "#15803d" : "#b91c1c",
                              }}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <button
                              type="button"
                              onClick={() => handleUserStatusToggle(user.id)}
                              style={{
                                padding: "0.35rem 0.65rem",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              {user.status === "Active" ? "Suspend" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* LISTINGS TAB */}
          {activeTab === "listings" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "var(--radius-sm, 8px)",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "0.825rem", color: "#64748b" }}>
                      <th style={{ padding: "0.85rem 1rem" }}>Title</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Owner</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Category</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Price</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings
                      .filter(
                        (l) =>
                          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.owner.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((listing) => (
                        <tr key={listing.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" }}>
                          <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{listing.title}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>{listing.owner}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>{listing.category}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>{listing.price}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.6rem",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background:
                                  listing.status === "Approved"
                                    ? "#dcfce7"
                                    : listing.status === "Pending"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                color:
                                  listing.status === "Approved"
                                    ? "#15803d"
                                    : listing.status === "Pending"
                                    ? "#b45309"
                                    : "#b91c1c",
                              }}
                            >
                              {listing.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              {listing.status !== "Approved" && (
                                <button
                                  type="button"
                                  onClick={() => handleListingAction(listing.id, "Approved")}
                                  style={{
                                    padding: "0.3rem 0.5rem",
                                    borderRadius: "4px",
                                    border: "none",
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteListing(listing.id)}
                                style={{
                                  padding: "0.3rem 0.5rem",
                                  borderRadius: "4px",
                                  border: "none",
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === "categories" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Rental Categories</h3>
                <button
                  type="button"
                  onClick={() => setShowAddCat((prev) => !prev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 0.85rem",
                    background: "var(--color-terracotta, #e05638)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "var(--radius-sm, 6px)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <Plus size={16} /> Add Category
                </button>
              </div>

              <AnimatePresence>
                {showAddCat && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddCategory}
                    style={{
                      background: "#ffffff",
                      padding: "1rem 1.25rem",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      marginBottom: "1.5rem",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Category Name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "0.55rem 0.75rem",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: "0.55rem 1rem",
                        background: "#059669",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Save
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      background: "#ffffff",
                      padding: "1.25rem",
                      borderRadius: "var(--radius-sm, 8px)",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "2rem" }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{cat.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{cat.count} Items Listed</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "var(--radius-sm, 8px)",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "0.825rem", color: "#64748b" }}>
                      <th style={{ padding: "0.85rem 1rem" }}>Target Listing</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Reported By</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Reason</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Date</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((rep) => (
                      <tr key={rep.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" }}>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{rep.listing}</td>
                        <td style={{ padding: "0.85rem 1rem" }}>{rep.reportedBy}</td>
                        <td style={{ padding: "0.85rem 1rem", color: "#dc2626" }}>{rep.reason}</td>
                        <td style={{ padding: "0.85rem 1rem" }}>{rep.date}</td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: rep.status === "Resolved" ? "#dcfce7" : "#fee2e2",
                              color: rep.status === "Resolved" ? "#15803d" : "#b91c1c",
                            }}
                          >
                            {rep.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          {rep.status === "Open" && (
                            <button
                              type="button"
                              onClick={() => handleResolveReport(rep.id)}
                              style={{
                                padding: "0.3rem 0.6rem",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}



// import { useNavigate } from "react-router-dom";

// export default function AdminDashboard() {
//   const navigate = useNavigate();
//   const admin = JSON.parse(localStorage.getItem("adminUser") || "null");

//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     localStorage.removeItem("adminUser");
//     navigate("/admin/login");
//   };

//   return (
//     <main className="app" style={{ padding: "2rem" }}>
//       <h1>Admin Dashboard</h1>
//       <p>Welcome, {admin?.username || "Admin"}.</p>

//       <button
//         type="button"
//         onClick={handleLogout}
//         className="button button--primary"
//       >
//         Log out
//       </button>
//     </main>
//   );
// }