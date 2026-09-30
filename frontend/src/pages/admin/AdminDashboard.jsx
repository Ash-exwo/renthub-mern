import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Building2,
  FolderTree,
  Flag,
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
  Menu,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-espresso)] relative overflow-x-hidden w-full font-[var(--font-sans)]">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`w-64 bg-slate-900 text-slate-100 flex flex-col p-6 shrink-0 transition-transform duration-300 z-50 fixed lg:static top-0 bottom-0 left-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } shadow-2xl lg:shadow-none`}
      >
        <div className="mb-8 pl-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            RentHub Platform
          </span>
          <h2 className="text-xl font-bold text-[var(--color-terracotta)] mt-1">
            Admin Console
          </h2>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm font-medium w-full text-left cursor-pointer ${
                  isActive
                    ? "bg-[var(--color-brand-primary)] text-white font-semibold shadow-md shadow-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                  setIsMobileMenuOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-800 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium mt-auto cursor-pointer"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden w-full">
        {/* HEADER */}
        <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden flex items-center justify-center p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-espresso)] cursor-pointer hover:bg-[var(--color-surface-hover)]"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle admin menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--color-espresso)] capitalize">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} className="text-slate-400 cursor-pointer hover:text-[var(--color-espresso)] transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white grid place-items-center font-bold text-xs shadow-md">
                {(admin?.username || "A").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col">
                <div className="text-xs font-semibold text-[var(--color-espresso)]">{admin?.username || "Admin"}</div>
                <div className="text-[11px] text-slate-400">System Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {/* BODY CONTENT */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {(activeTab === "users" || activeTab === "listings") && (
            <div className="mb-6 flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--color-terracotta)]"
                />
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
                {INITIAL_STATS.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.id}
                      className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <span className="text-xs text-slate-500">{stat.label}</span>
                        <h3 className="text-2xl font-bold text-[var(--color-espresso)] my-1">
                          {stat.value}
                        </h3>
                        <span className="text-xs font-semibold" style={{ color: stat.color }}>
                          {stat.change}
                        </span>
                      </div>
                      <div
                        className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
                        style={{
                          background: `${stat.color}15`,
                          color: stat.color,
                        }}
                      >
                        <Icon size={22} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                <div className="bg-[var(--color-surface)] p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
                  <h3 className="text-base font-bold text-[var(--color-espresso)] mb-4">
                    Pending Listing Approvals
                  </h3>
                  <div className="flex flex-col gap-3">
                    {listings
                      .filter((l) => l.status === "Pending")
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between flex-wrap gap-2 p-3 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface-secondary)]"
                        >
                          <div>
                            <div className="font-semibold text-sm text-[var(--color-espresso)]">{item.title}</div>
                            <div className="text-xs text-slate-500">
                              By {item.owner} • {item.price}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleListingAction(item.id, "Approved")}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleListingAction(item.id, "Rejected")}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    {listings.filter((l) => l.status === "Pending").length === 0 && (
                      <p className="text-sm text-slate-500">No pending listings.</p>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
                  <h3 className="text-base font-bold text-[var(--color-espresso)] mb-4">
                    System Status
                  </h3>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Logged in as</span>
                      <span className="font-semibold text-[var(--color-espresso)]">{admin?.username || "Admin"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Categories</span>
                      <span className="font-semibold text-[var(--color-espresso)]">{categories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Open Reports</span>
                      <span className="font-semibold text-red-600">
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
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-x-auto shadow-sm w-full">
                <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Joined</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
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
                        <tr key={user.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-[var(--color-espresso)]">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{user.role}</td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{user.joined}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                user.status === "Active"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleUserStatusToggle(user.id)}
                              className="px-3 py-1 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-espresso)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
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
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-x-auto shadow-sm w-full">
                <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Owner</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
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
                        <tr key={listing.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-[var(--color-espresso)]">{listing.title}</td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{listing.owner}</td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{listing.category}</td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{listing.price}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                listing.status === "Approved"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : listing.status === "Pending"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              {listing.status !== "Approved" && (
                                <button
                                  type="button"
                                  onClick={() => handleListingAction(listing.id, "Approved")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteListing(listing.id)}
                                className="p-1 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={15} />
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
              <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
                <h3 className="font-bold text-lg text-[var(--color-espresso)]">Rental Categories</h3>
                <button
                  type="button"
                  onClick={() => setShowAddCat((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-terracotta)] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
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
                    className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] mb-6 flex flex-wrap gap-3 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Category Name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 min-w-[180px] px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-emerald-700 transition-colors"
                    >
                      Save
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4 shadow-sm"
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">{cat.name}</div>
                      <div className="text-xs text-slate-500">{cat.count} Items Listed</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-x-auto shadow-sm w-full">
                <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-5 py-3">Target Listing</th>
                      <th className="px-5 py-3">Reported By</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((rep) => (
                      <tr key={rep.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-[var(--color-espresso)]">{rep.listing}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{rep.reportedBy}</td>
                        <td className="px-5 py-3.5 text-red-600 font-medium">{rep.reason}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{rep.date}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              rep.status === "Resolved"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-red-500/10 text-red-600"
                            }`}
                          >
                            {rep.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {rep.status === "Open" && (
                            <button
                              type="button"
                              onClick={() => handleResolveReport(rep.id)}
                              className="px-3 py-1 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-espresso)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
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
