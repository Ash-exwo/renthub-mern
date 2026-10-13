import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Plus,
  X,
  Menu,
  Edit3,
  Power,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Check,
  Sun,
  Moon,
  Inbox,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Pause,
  Eye,
  FileText,
} from "lucide-react";
import api from "../../utils/api";
import { getAdminToken, getAdminUser, adminLogout } from "../../utils/auth";

// Preset rental emojis for interactive picker
const PRESET_EMOJIS = [
  { emoji: "🏠", label: "Properties & Villas" },
  { emoji: "🚗", label: "Cars & Vehicles" },
  { emoji: "📷", label: "Cameras & Optics" },
  { emoji: "💻", label: "Computers & Tech" },
  { emoji: "🔧", label: "Tools & Hardware" },
  { emoji: "🎉", label: "Party & Events" },
  { emoji: "🚲", label: "Bikes & Scooters" },
  { emoji: "⛺", label: "Camping & Outdoors" },
  { emoji: "🎸", label: "Musical Gear" },
  { emoji: "🏄", label: "Sports & Surf" },
  { emoji: "👗", label: "Fashion & Costumes" },
  { emoji: "🛋️", label: "Furniture & Decor" },
  { emoji: "🏋️", label: "Fitness & Gym" },
  { emoji: "🛸", label: "Drones & Robotics" },
  { emoji: "🎮", label: "Gaming & VR" },
  { emoji: "📚", label: "Books & Education" },
  { emoji: "🛥️", label: "Boats & Marine" },
  { emoji: "📦", label: "General Equipment" },
];

// Interactive Chart Data Series for Spline Area & Bar Charts
const REVENUE_DATA = {
  "7D": [
    { label: "Mon", revenue: 14200, bookings: 12, x: 20, y: 150 },
    { label: "Tue", revenue: 18500, bookings: 15, x: 80, y: 135 },
    { label: "Wed", revenue: 24100, bookings: 19, x: 140, y: 110 },
    { label: "Thu", revenue: 21800, bookings: 16, x: 200, y: 120 },
    { label: "Fri", revenue: 34400, bookings: 27, x: 260, y: 65 },
    { label: "Sat", revenue: 45600, bookings: 35, x: 320, y: 25 },
    { label: "Sun", revenue: 39900, bookings: 31, x: 380, y: 45 },
  ],
  "30D": [
    { label: "W1", revenue: 86400, bookings: 78, x: 20, y: 140 },
    { label: "W2", revenue: 112000, bookings: 94, x: 140, y: 105 },
    { label: "W3", revenue: 134500, bookings: 118, x: 260, y: 65 },
    { label: "W4", revenue: 149600, bookings: 129, x: 380, y: 30 },
  ],
  "12M": [
    { label: "Nov", revenue: 240000, bookings: 190, x: 20, y: 155 },
    { label: "Dec", revenue: 310000, bookings: 250, x: 92, y: 125 },
    { label: "Jan", revenue: 280000, bookings: 220, x: 164, y: 138 },
    { label: "Feb", revenue: 345000, bookings: 285, x: 236, y: 95 },
    { label: "Mar", revenue: 410000, bookings: 330, x: 308, y: 55 },
    { label: "Apr", revenue: 482500, bookings: 388, x: 380, y: 20 },
  ],
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Category Created",
    desc: "Category stored successfully in MongoDB database.",
    time: "10m ago",
    unread: true,
    type: "success",
  },
  {
    id: 2,
    title: "Pending Listing Review",
    desc: "DSLR Camera Kit & Lens submitted by Rahul Nair.",
    time: "45m ago",
    unread: true,
    type: "warning",
  },
  {
    id: 3,
    title: "Listing Flagged",
    desc: "Beachfront Villa flagged for misleading photos.",
    time: "2h ago",
    unread: true,
    type: "danger",
  },
  {
    id: 4,
    title: "New Host Joined",
    desc: "New owner registered as a verified rental host.",
    time: "1d ago",
    unread: false,
    type: "info",
  },
];

const REPORT_CATEGORY_META = {
  scam_off_platform: { label: "Off-Platform Scam", badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  misleading: { label: "Misleading Info", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  safety_hazard: { label: "Safety Hazard", badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  prohibited: { label: "Prohibited Item", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  abusive_conduct: { label: "Abusive Conduct", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" },
  other: { label: "Other Violation", badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20" },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getAdminUser();

  // Navigation: Default lands on OVERVIEW tab!
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Theme State: Supports both Light and Dark modes!
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("renthub_theme_v2") === "dark";
    } catch {
      return false;
    }
  });

  const toggleTheme = useCallback(() => {
    const nextTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("renthub_theme_v2", nextTheme);
    } catch {
      // ignore
    }
  }, [isDark]);

  // Interactive Notification Bell Popover State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const notifRef = useRef(null);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Analytics Chart State
  const [chartTimeframe, setChartTimeframe] = useState("7D");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Live Database Category State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categoryFeedback, setCategoryFeedback] = useState({ type: "", message: "" });

  // Add / Edit Category Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    name: "",
    description: "",
    icon: "🏠",
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Live Database Platform Entities State (Users, Listings, Reports)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportCounts, setReportCounts] = useState({
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0,
    dismissed: 0,
  });
  const [reportFilter, setReportFilter] = useState("all");
  const [actionModal, setActionModal] = useState({
    open: false,
    report: null,
    nextStatus: "resolved",
    actionTaken: "none",
    adminNotes: "",
    submitting: false,
  });

  // Clear feedback banner after 4 seconds
  useEffect(() => {
    if (categoryFeedback.message) {
      const timer = setTimeout(() => {
        setCategoryFeedback({ type: "", message: "" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [categoryFeedback]);

  // Handle Logout
  const handleLogout = useCallback(() => {
    adminLogout();
    navigate("/admin/login");
  }, [navigate]);

  // Fetch Categories from Backend API (Live MongoDB)
  const fetchAdminCategories = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      handleLogout();
      return;
    }

    setLoadingCategories(true);
    setCategoryError("");

    try {
      const response = await api.get("/categories/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data?.categories || [];
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
      const msg = err.response?.data?.message || "Failed to load categories from database.";
      setCategoryError(msg);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingCategories(false);
    }
  }, [handleLogout]);

  // Fetch Listings from Backend API (Live MongoDB)
  const fetchAdminListings = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    setLoadingListings(true);
    try {
      const response = await api.get("/listings/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(response.data?.listings || []);
    } catch (err) {
      console.error("Failed to load admin listings:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingListings(false);
    }
  }, [handleLogout]);

  // Fetch Users from Backend API (Live MongoDB)
  const fetchAdminUsers = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    setLoadingUsers(true);
    try {
      const response = await api.get("/auth/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data?.users || []);
    } catch (err) {
      console.error("Failed to load admin users:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [handleLogout]);

  // Fetch Reports from Backend API (Live MongoDB)
  const fetchAdminReports = useCallback(async (filterParam) => {
    const token = getAdminToken();
    if (!token) return;

    setLoadingReports(true);
    try {
      const activeFilt = filterParam !== undefined ? filterParam : reportFilter;
      const statusQuery = activeFilt && activeFilt !== "all" ? `?status=${activeFilt}` : "";
      const response = await api.get(`/reports/admin${statusQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data?.reports || []);
      if (response.data?.counts) {
        setReportCounts(response.data.counts);
      }
    } catch (err) {
      console.error("Failed to load admin reports:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingReports(false);
    }
  }, [reportFilter, handleLogout]);

  // Load all live database entities on mount
  useEffect(() => {
    fetchAdminCategories();
    fetchAdminListings();
    fetchAdminUsers();
    fetchAdminReports();
  }, [fetchAdminCategories, fetchAdminListings, fetchAdminUsers, fetchAdminReports]);

  // Re-fetch reports when filter changes
  useEffect(() => {
    if (activeTab === "reports") {
      fetchAdminReports(reportFilter);
    }
  }, [reportFilter, activeTab, fetchAdminReports]);

  // Open Add Category Modal
  const openAddModal = () => {
    setEditingCategory(null);
    setModalFormData({
      name: "",
      description: "",
      icon: "🏠",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  // Open Edit Category Modal
  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setModalFormData({
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "📦",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  // Submit Add or Edit Category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const trimmedName = modalFormData.name.trim();
    if (!trimmedName) {
      setModalError("Category name is required.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      if (editingCategory) {
        // Edit category PUT /api/categories/:id
        const res = await api.put(
          `/categories/${editingCategory._id}`,
          {
            name: trimmedName,
            description: modalFormData.description.trim(),
            icon: modalFormData.icon || "📦",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCategories((prev) =>
          prev.map((c) => (c._id === editingCategory._id ? res.data.category : c))
        );
        setCategoryFeedback({
          type: "success",
          message: `Category "${res.data.category.name}" updated successfully.`,
        });
      } else {
        // Create category POST /api/categories
        const res = await api.post(
          "/categories",
          {
            name: trimmedName,
            description: modalFormData.description.trim(),
            icon: modalFormData.icon || "📦",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCategories((prev) => [res.data.category, ...prev]);
        setCategoryFeedback({
          type: "success",
          message: `Category "${res.data.category.name}" created and stored in database.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
      setModalError(
        err.response?.data?.message || "Failed to save category. Please check details."
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  // Toggle Category Status (Activate / Deactivate - Strictly No Delete)
  const handleToggleStatus = async (cat) => {
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const nextStatus = !cat.isActive;

    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c._id === cat._id ? { ...c, isActive: nextStatus } : c))
    );

    try {
      const res = await api.patch(
        `/categories/${cat._id}/status`,
        { isActive: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategoryFeedback({
        type: "success",
        message: res.data.message || `Category ${nextStatus ? "activated" : "deactivated"}.`,
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert optimistic update
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, isActive: cat.isActive } : c))
      );
      setCategoryFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to update category status.",
      });
    }
  };

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (categoryFilter === "active") return matchesSearch && cat.isActive === true;
      if (categoryFilter === "inactive") return matchesSearch && cat.isActive === false;
      return matchesSearch;
    });
  }, [categories, searchQuery, categoryFilter]);

  // Category counts
  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);
  const inactiveCount = categories.length - activeCount;

  // Overview Bento KPIs (Live Database Metrics)
  const activeListingsCount = useMemo(() => listings.filter((l) => l.isActive).length, [listings]);

  const stats = [
    {
      id: "stat-users",
      label: "Registered Users",
      value: users.length.toString(),
      change: `${users.length} in DB`,
      trendLabel: "live users",
      icon: Users,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "stat-listings",
      label: "Platform Listings",
      value: listings.length.toString(),
      change: `${activeListingsCount} Active`,
      trendLabel: "in DB",
      icon: Building2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "stat-revenue",
      label: "Platform Revenue",
      value: "₹4,82,500",
      change: "+18%",
      trendLabel: "vs last month",
      icon: TrendingUp,
      color: "text-[var(--color-brand-primary)] bg-[var(--color-brand-primary-subtle)] border-rose-500/20",
    },
    {
      id: "stat-categories",
      label: "Catalog Categories",
      value: categories.length.toString(),
      change: `${activeCount} Active`,
      trendLabel: "in DB",
      icon: FolderTree,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  // Active chart series
  const activeSeries = REVENUE_DATA[chartTimeframe] || REVENUE_DATA["7D"];

  // Users tab actions
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user from the database?")) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await api.delete(`/auth/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
      setCategoryFeedback({
        type: "success",
        message: "User deleted successfully from database.",
      });
    } catch (err) {
      console.error("Failed to delete user:", err);
      setCategoryFeedback({
        type: "error",
        message: "Failed to delete user.",
      });
    }
  };

  // Listings tab actions
  const handleListingAction = async (id, newStatus) => {
    const token = getAdminToken();
    if (!token) return;
    const isAct = newStatus === "Approved" || newStatus === "available";
    const avail = newStatus === "Approved" ? "available" : (newStatus === "Paused" ? "unavailable" : newStatus);

    try {
      await api.patch(
        `/listings/admin/${id}/status`,
        { isActive: isAct, availability: avail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminListings();
      setCategoryFeedback({
        type: "success",
        message: `Listing status updated to ${newStatus}.`,
      });
    } catch (err) {
      console.error("Failed to update listing status:", err);
      setCategoryFeedback({
        type: "error",
        message: "Failed to update listing status.",
      });
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing from database?")) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await api.delete(`/listings/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings((prev) => prev.filter((l) => (l._id || l.id) !== id));
      setCategoryFeedback({
        type: "success",
        message: "Listing permanently deleted from database.",
      });
    } catch (err) {
      console.error("Failed to delete listing:", err);
      setCategoryFeedback({
        type: "error",
        message: "Failed to delete listing.",
      });
    }
  };

  // Moderation & Reports Handlers (Live MongoDB)
  const handleReportAction = async (reportId, nextStatus, actionTaken = "none", adminNotes = "") => {
    const token = getAdminToken();
    if (!token) {
      handleLogout();
      return;
    }

    setActionModal((prev) => ({ ...prev, submitting: true }));

    try {
      const response = await api.patch(
        `/reports/admin/${reportId}/action`,
        { status: nextStatus, actionTaken, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategoryFeedback({
        type: "success",
        message: response.data?.message || "Report updated successfully.",
      });

      // Refresh both reports & listings (in case listing was paused)
      fetchAdminReports();
      fetchAdminListings();
      setActionModal({
        open: false,
        report: null,
        nextStatus: "resolved",
        actionTaken: "none",
        adminNotes: "",
        submitting: false,
      });
    } catch (err) {
      console.error("Failed to update report action:", err);
      setCategoryFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to update report action.",
      });
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleQuickPauseListing = async (report) => {
    if (!report?.targetListing?._id && !report?.targetListing) return;
    const confirmPause = window.confirm(
      `Are you sure you want to pause listing "${report.targetListing?.title || "item"}" immediately? This will freeze the item on the live platform.`
    );
    if (!confirmPause) return;

    await handleReportAction(
      report._id,
      "resolved",
      "listing_paused",
      "Listing paused immediately by administrator for safety review."
    );
  };

  const handleQuickDismissReport = async (report) => {
    await handleReportAction(report._id, "dismissed", "dismissed", "Dismissed without further action.");
  };

  const handleOpenActionModal = (report, defaultStatus = "resolved") => {
    setActionModal({
      open: true,
      report,
      nextStatus: defaultStatus,
      actionTaken: report.actionTaken || "none",
      adminNotes: report.adminNotes || "",
      submitting: false,
    });
  };

  // Filtered reports for search query
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter((r) => {
      const title = r.targetListing?.title || "";
      const reporter = r.reporter?.name || "";
      const owner = r.targetUser?.name || "";
      const reason = r.reason || "";
      const notes = r.adminNotes || "";
      return (
        title.toLowerCase().includes(q) ||
        reporter.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q)
      );
    });
  }, [reports, searchQuery]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-canvas)] text-[var(--color-espresso)] font-[var(--font-sans)] transition-colors duration-200">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ======================================================== */}
      {/* UPGRADED SIDEBAR (Matches Image 3 Luxury Reference)      */}
      {/* ======================================================== */}
      <aside
        className={`w-68 h-screen bg-[var(--color-surface)] dark:bg-[#0B101E] border-r border-[var(--color-border)] text-[var(--color-espresso)] flex flex-col p-6 shrink-0 transition-transform duration-300 z-50 fixed lg:static top-0 bottom-0 left-0 overflow-y-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } shadow-2xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 pl-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-brand-primary)] to-rose-600 grid place-items-center text-white font-black text-xl shadow-lg shadow-rose-500/25">
            R
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-[var(--color-espresso)]">
              RentHub
            </h2>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-brand-primary)]">
              Admin Console
            </span>
          </div>
        </div>

        {/* Administrator Profile Card (Image 3 Style) */}
        <div className="p-3.5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] mb-6 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-sm grid place-items-center shadow-sm">
              {(admin?.username || "A").charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[var(--color-surface)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-[var(--color-espresso)] truncate">
              {admin?.username || "Administrator"}
            </div>
            <div className="text-[11px] text-[var(--color-muted-grey)]">System Admin</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "categories", label: "Categories", icon: FolderTree },
            { id: "users", label: "Users Management", icon: Users },
            { id: "listings", label: "Listings Control", icon: Building2 },
            { id: "reports", label: "Reports & Flags", icon: Flag, badge: reportCounts.pending },
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
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-[var(--color-brand-primary)] text-white shadow-lg shadow-rose-500/25 font-bold"
                    : "text-[var(--color-secondary-text)] hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </div>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                      isActive ? "bg-white text-[var(--color-brand-primary)]" : "bg-rose-500 text-white shadow-xs"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* BOTTOM UTILITY (Interactive Light / Dark Switch & Logout) */}
        <div className="pt-4 border-t border-[var(--color-border)] mt-auto space-y-3">
          {/* Sleek Light / Dark Toggle Switch (Image 3 Style) */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-secondary-text)] pl-1">
              <Sun size={14} className={!isDark ? "text-amber-500" : "text-slate-400"} />
              <span className={!isDark ? "text-[var(--color-espresso)] font-extrabold" : ""}>Light</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                isDark ? "bg-[var(--color-brand-primary)] justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
              }`}
              aria-label="Toggle theme mode"
              title="Toggle Light / Dark mode"
            >
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]"
              >
                {isDark ? "🌙" : "☀️"}
              </motion.div>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-secondary-text)] pr-1">
              <span className={isDark ? "text-[var(--color-espresso)] font-extrabold" : ""}>Dark</span>
              <Moon size={14} className={isDark ? "text-indigo-400" : "text-slate-400"} />
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors text-xs font-bold cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN CONTENT WORKSPACE                                   */}
      {/* ======================================================== */}
      <main className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto w-full relative">
        {/* HEADER BAR */}
        <header className="h-18 shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 sm:px-8 gap-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              className="lg:hidden flex items-center justify-center p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-espresso)] cursor-pointer hover:bg-[var(--color-surface-subtle)]"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle admin navigation"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-espresso)] capitalize tracking-tight">
              {activeTab === "overview"
                ? "Overview & Analytics"
                : activeTab === "categories"
                ? "Rental Categories"
                : activeTab === "reports"
                ? "Trust & Safety Moderation"
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* INTERACTIVE NOTIFICATION BELL */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative p-2.5 rounded-full border border-[var(--color-border)] text-slate-500 hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-brand-primary)] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[var(--color-surface)] animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 p-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[var(--color-espresso)]">
                          Administrative Alerts
                        </h4>
                        {unreadNotifCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] font-bold text-[var(--color-brand-primary)] hover:underline cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border transition-colors flex items-start justify-between gap-2.5 ${
                              item.unread
                                ? "bg-[var(--color-surface-subtle)] border-[var(--color-brand-primary)]/30"
                                : "bg-transparent border-[var(--color-border-subtle)] opacity-75"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  item.type === "success"
                                    ? "bg-emerald-500"
                                    : item.type === "warning"
                                    ? "bg-amber-500"
                                    : item.type === "danger"
                                    ? "bg-rose-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--color-espresso)] truncate">
                                  {item.title}
                                </div>
                                <div className="text-[11px] text-[var(--color-secondary-text)] line-clamp-2 mt-0.5">
                                  {item.desc}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">{item.time}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => dismissNotification(item.id)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                              title="Dismiss"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400">
                          <Inbox size={24} className="mx-auto mb-2 opacity-50" />
                          No active notifications
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* FEEDBACK TOAST BANNER */}
        <AnimatePresence>
          {categoryFeedback.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mx-4 sm:mx-8 mt-4 px-4 py-3 rounded-2xl border flex items-center justify-between text-sm font-semibold shadow-xs ${
                categoryFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {categoryFeedback.type === "success" ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={18} className="text-rose-600" />
                )}
                <span>{categoryFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCategoryFeedback({ type: "", message: "" })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BODY WORKSPACE */}
        <div className="p-4 sm:p-8 flex-1 max-w-7xl w-full">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW & ADVANCED ANIMATED GRAPHS (IMAGE 3)    */}
          {/* ======================================================== */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Top 4 Bento KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.id}
                      className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)] shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
                    >
                      <div>
                        <span className="text-xs font-bold text-[var(--color-muted-grey)] uppercase tracking-wider">
                          {stat.label}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-espresso)] my-1 tracking-tight">
                          {stat.value}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                            {stat.change}
                          </span>
                          <span className="text-[var(--color-muted-grey)] font-medium">
                            {stat.trendLabel}
                          </span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl grid place-items-center shrink-0 border ${stat.color}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BENTO GRID: ADVANCED ANIMATED CHARTS (Image 3 Inspiration) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Wavy Spline Area Chart (Revenue & Growth - Image 3 Spline) (2 Cols) */}
                <div className="lg:col-span-2 bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                          Financial Performance
                        </div>
                        <h3 className="font-black text-lg text-[var(--color-espresso)] tracking-tight">
                          Platform Rental Revenue & Growth
                        </h3>
                      </div>

                      {/* Timeframe selector */}
                      <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)] text-xs font-bold">
                        {["7D", "30D", "12M"].map((tf) => (
                          <button
                            key={tf}
                            type="button"
                            onClick={() => {
                              setChartTimeframe(tf);
                              setHoveredPoint(null);
                            }}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                              chartTimeframe === tf
                                ? "bg-[var(--color-surface)] text-[var(--color-espresso)] shadow-xs"
                                : "text-slate-500 hover:text-[var(--color-espresso)]"
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hover Tooltip Value Banner */}
                    <div className="h-10 flex items-center justify-between text-xs px-1 mb-2">
                      {hoveredPoint ? (
                        <div className="flex items-center gap-4 bg-[var(--color-surface-subtle)] px-3 py-1.5 rounded-xl border border-[var(--color-border)]">
                          <span className="font-extrabold text-[var(--color-espresso)]">
                            {hoveredPoint.label}
                          </span>
                          <span className="text-[var(--color-brand-primary)] font-black">
                            ₹{hoveredPoint.revenue.toLocaleString()}
                          </span>
                          <span className="text-slate-500">
                            {hoveredPoint.bookings} Rentals
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]" />
                          <span>Hover over chart spline points to inspect detailed volume</span>
                        </div>
                      )}
                      <span className="text-emerald-600 font-extrabold text-xs">
                        +24.6% Avg ROI
                      </span>
                    </div>
                  </div>

                  {/* SVG Wavy Spline Curve */}
                  <div className="relative w-full h-56 pt-2">
                    <svg viewBox="0 0 400 180" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="splineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FF385C" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#FF385C" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d="M 20,180 L 20,150 C 80,135 140,110 200,120 C 260,65 320,25 380,45 L 380,180 Z"
                        fill="url(#splineGradient)"
                      />

                      {/* Smooth Bezier Spline Stroke */}
                      <path
                        d="M 20,150 C 80,135 140,110 200,120 C 260,65 320,25 380,45"
                        fill="none"
                        stroke="#FF385C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Secondary Comparison Ghost Line */}
                      <path
                        d="M 20,165 C 80,155 140,140 200,145 C 260,110 320,80 380,95"
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        strokeOpacity="0.4"
                      />

                      {/* Interactive Data Points */}
                      {activeSeries.map((pt, idx) => {
                        const isHovered = hoveredPoint?.label === pt.label;
                        return (
                          <g
                            key={idx}
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 7 : 4.5}
                              className="fill-white stroke-[var(--color-brand-primary)] stroke-3 transition-all"
                            />
                            {isHovered && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={12}
                                className="fill-[var(--color-brand-primary)]/20 animate-ping"
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2 px-1">
                      {activeSeries.map((pt, idx) => (
                        <span key={idx}>{pt.label}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Circular Radial Donut Progress Chart (Category Demand - Image 3 Style) (1 Col) */}
                <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-base text-[var(--color-espresso)]">
                        Category Demand
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("categories")}
                        className="text-xs font-bold text-[var(--color-brand-primary)] hover:underline cursor-pointer"
                      >
                        Manage &rarr;
                      </button>
                    </div>

                    {/* Donut Radial Visual */}
                    <div className="relative w-44 h-44 mx-auto my-2">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {/* Background Ring */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-slate-100 dark:stroke-slate-800"
                          strokeWidth="11"
                          fill="none"
                        />
                        {/* Progress Segment */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#FF385C"
                          strokeWidth="11"
                          fill="none"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 45 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                        {/* Secondary Segment */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#4F46E5"
                          strokeWidth="11"
                          fill="none"
                          strokeDasharray="251.2"
                          strokeDashoffset="190"
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Center Stats */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-[var(--color-espresso)]">
                          86%
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Active Demand
                        </span>
                      </div>
                    </div>

                    {/* Categories Breakdown Legend */}
                    <div className="space-y-2 mt-4">
                      {categories.slice(0, 4).map((c, i) => {
                        const shares = ["42%", "26%", "18%", "14%"];
                        return (
                          <div key={c._id} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 font-semibold text-[var(--color-espresso)] truncate">
                              <span>{c.icon || "📦"}</span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="font-extrabold text-slate-500">{shares[i] || "10%"}</span>
                          </div>
                        );
                      })}
                      {categories.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">
                          No categories registered yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--color-border-subtle)] text-center">
                    <span className="text-[11px] text-[var(--color-muted-grey)]">
                      {categories.length} Total Categories in MongoDB
                    </span>
                  </div>
                </div>

                {/* 3. Platform Booking Volume Bar Chart with Highlight Pill (1 Col) */}
                <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-base text-[var(--color-espresso)]">
                        Daily Booking Volume
                      </h3>
                      <p className="text-xs text-slate-400">Confirmed item rentals</p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-extrabold">
                      Peak: Sat (35)
                    </span>
                  </div>

                  {/* Vertical Column Bars */}
                  <div className="flex items-end justify-between gap-2 h-44 pt-4 border-b border-[var(--color-border)] px-1">
                    {REVENUE_DATA["7D"].map((day, idx) => {
                      const isPeak = day.label === "Sat";
                      const height = Math.round((day.bookings / 35) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          {isPeak && (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full mb-1">
                              Peak
                            </span>
                          )}
                          <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden h-full flex flex-col justify-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`w-full rounded-t-lg ${
                                isPeak
                                  ? "bg-[var(--color-brand-primary)]"
                                  : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Recent Platform Listings (Live MongoDB) */}
                <div className="lg:col-span-2 bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-base text-[var(--color-espresso)]">
                        Recent Platform Listings
                      </h3>
                      <p className="text-xs text-slate-400">Live rental listings from MongoDB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("listings")}
                      className="text-xs font-bold text-[var(--color-brand-primary)] hover:underline cursor-pointer"
                    >
                      View all &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {listings.slice(0, 5).map((item) => {
                      const itemId = item._id || item.id;
                      const ownerName = typeof item.owner === "object" ? item.owner?.name || "User" : item.owner || "User";
                      const catName = typeof item.category === "object" ? item.category?.name || "General" : item.category || "General";
                      const catIcon = typeof item.category === "object" ? item.category?.icon : null;
                      const priceStr = "₹" + Number(item.rentalPricePerDay || 0).toLocaleString("en-IN") + "/day";
                      const isLive = item.isActive;

                      return (
                        <div
                          key={itemId}
                          className="flex items-center justify-between flex-wrap gap-2 p-3.5 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface-subtle)]"
                        >
                          <div>
                            <div className="font-bold text-sm text-[var(--color-espresso)]">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              By {ownerName} • {catIcon && <span>{catIcon} </span>}{catName} • {priceStr}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleListingAction(itemId, isLive ? "Paused" : "Approved")}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                isLive
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                              }`}
                            >
                              {isLive ? "Pause" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteListing(itemId)}
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Listing"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {listings.length === 0 && (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No listings found in MongoDB yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CATEGORIES (Live MongoDB + Emoji Picker Modal)     */}
          {/* ======================================================== */}
          {activeTab === "categories" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-[var(--color-espresso)] tracking-tight">
                    Rental Categories Catalog
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live categories stored in MongoDB. Activated categories appear in customer search dropdowns.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fetchAdminCategories}
                    disabled={loadingCategories}
                    className="p-2.5 rounded-full border border-[var(--color-border)] text-slate-600 dark:text-slate-300 hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh categories from database"
                  >
                    <RefreshCw size={16} className={loadingCategories ? "animate-spin" : ""} />
                  </button>

                  <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-brand-primary)] text-white text-sm font-bold shadow-md shadow-rose-500/25 hover:opacity-95 transition-all cursor-pointer"
                  >
                    <Plus size={18} />
                    <span>Add Category</span>
                  </button>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search categories by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-secondary)] rounded-2xl border border-[var(--color-border)] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      categoryFilter === "all"
                        ? "bg-[var(--color-surface)] text-[var(--color-espresso)] shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-[var(--color-espresso)]"
                    }`}
                  >
                    All ({categories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("active")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      categoryFilter === "active"
                        ? "bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-emerald-700"
                    }`}
                  >
                    Active ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("inactive")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      categoryFilter === "inactive"
                        ? "bg-[var(--color-surface)] text-amber-700 dark:text-amber-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-amber-700"
                    }`}
                  >
                    Inactive ({inactiveCount})
                  </button>
                </div>
              </div>

              {/* Error banner */}
              {categoryError && (
                <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
                  <span>{categoryError}</span>
                  <button
                    type="button"
                    onClick={fetchAdminCategories}
                    className="text-xs font-bold underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Category Bento Cards Grid */}
              {loadingCategories ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] flex items-center gap-4 animate-pulse"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCategories.map((cat) => (
                    <motion.div
                      key={cat._id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`group bg-[var(--color-surface)] p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                        cat.isActive
                          ? "border-[var(--color-border)] hover:border-slate-300 dark:hover:border-slate-700"
                          : "border-dashed border-amber-400/80 bg-amber-500/5 opacity-85"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Big Emoji Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          {cat.icon || "📦"}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-black text-base text-[var(--color-espresso)] truncate">
                              {cat.name}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider ${
                                cat.isActive
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {cat.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {cat.description || "General rental category catalog"}
                          </p>

                          <div className="text-[11px] font-bold text-slate-400 mt-2.5">
                            {(cat.count ?? 0) > 0 ? `${cat.count} Items Listed` : "Available in Catalog"}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions (Activate/Deactivate & Edit) */}
                      <div className="mt-5 pt-3.5 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            cat.isActive
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          <Power size={13} />
                          <span>{cat.isActive ? "Deactivate" : "Activate"}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-[var(--color-surface)] p-12 text-center rounded-3xl border border-dashed border-[var(--color-border)]">
                  <div className="text-4xl mb-3">📁</div>
                  <h3 className="font-bold text-base text-[var(--color-espresso)] mb-1">
                    No categories found
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                    {searchQuery
                      ? `No category matching "${searchQuery}". Clear search or create a new one.`
                      : "Your rental category catalog is currently empty."}
                  </p>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-brand-primary)] text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    <Plus size={16} /> Create Category
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: USERS MANAGEMENT                                  */}
          {/* ======================================================== */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-x-auto shadow-xs w-full">
                <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] text-xs text-slate-400 uppercase tracking-wider font-black">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(
                        (u) =>
                          (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((user) => {
                        const userId = user._id || user.id;
                        const joinedDate = user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : (user.joined || "Recent");
                        return (
                          <tr
                            key={userId}
                            className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-bold text-[var(--color-espresso)]">{user.name}</div>
                              <div className="text-xs text-slate-400">{user.email} {user.phone ? `• ${user.phone}` : ""}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-semibold">
                              {user.location || "Member"}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">{joinedDate}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(userId)}
                                className="px-3 py-1 rounded-xl border border-rose-500/20 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-400">
                          No registered users found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: LISTINGS CONTROL (Live MongoDB)                   */}
          {/* ======================================================== */}
          {activeTab === "listings" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-x-auto shadow-xs w-full">
                <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] text-xs text-slate-400 uppercase tracking-wider font-black">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings
                      .filter((l) => {
                        const title = l.title || "";
                        const ownerName = typeof l.owner === "object" ? l.owner?.name || "" : l.owner || "";
                        const q = searchQuery.toLowerCase();
                        return title.toLowerCase().includes(q) || ownerName.toLowerCase().includes(q);
                      })
                      .map((listing) => {
                        const listingId = listing._id || listing.id;
                        const ownerName = typeof listing.owner === "object" ? listing.owner?.name || "User" : listing.owner || "User";
                        const catName = typeof listing.category === "object" ? listing.category?.name || "General" : listing.category || "General";
                        const catIcon = typeof listing.category === "object" ? listing.category?.icon : null;
                        const priceStr = "₹" + Number(listing.rentalPricePerDay || 0).toLocaleString("en-IN") + "/day";
                        const isLive = listing.isActive;

                        return (
                          <tr
                            key={listingId}
                            className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-[var(--color-espresso)]">{listing.title}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{ownerName}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                              <span className="inline-flex items-center gap-1">
                                {catIcon && <span>{catIcon}</span>}
                                <span>{catName}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-200 font-black">{priceStr}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  isLive
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                }`}
                              >
                                {isLive ? "Active" : "Paused"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleListingAction(listingId, isLive ? "Paused" : "Approved")}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                                    isLive
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                                  }`}
                                >
                                  <Check size={13} />
                                  <span>{isLive ? "Pause" : "Activate"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteListing(listingId)}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                                  title="Delete Listing from Database"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {listings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400">
                          No listings found in MongoDB database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: REPORTS & FLAGS (Live MongoDB Content Moderation) */}
          {/* ======================================================== */}
          {activeTab === "reports" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* TOP SUMMARY KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Pending Review</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-espresso)] my-1 tracking-tight">
                      {reportCounts.pending}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium">Needs moderation action</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 grid place-items-center">
                    <ShieldAlert size={22} />
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Investigating</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-espresso)] my-1 tracking-tight">
                      {reportCounts.investigating}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium">Active inquiry</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 grid place-items-center">
                    <Eye size={22} />
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Resolved Cases</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-espresso)] my-1 tracking-tight">
                      {reportCounts.resolved}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium">Addressed & audited</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 grid place-items-center">
                    <ShieldCheck size={22} />
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reports</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-espresso)] my-1 tracking-tight">
                      {reportCounts.total}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium">All flags filed</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-slate-600 grid place-items-center">
                    <Flag size={22} />
                  </div>
                </div>
              </div>

              {/* SEARCH & STATUS FILTER TOOLBAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search by listing, reporter, host, or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-secondary)] rounded-2xl border border-[var(--color-border)] text-xs font-semibold overflow-x-auto">
                  {[
                    { id: "all", label: "All", count: reportCounts.total },
                    { id: "pending", label: "Pending", count: reportCounts.pending },
                    { id: "investigating", label: "Investigating", count: reportCounts.investigating },
                    { id: "resolved", label: "Resolved", count: reportCounts.resolved },
                    { id: "dismissed", label: "Dismissed", count: reportCounts.dismissed },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      type="button"
                      onClick={() => setReportFilter(filterTab.id)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        reportFilter === filterTab.id
                          ? "bg-[var(--color-surface)] text-[var(--color-brand-primary)] shadow-xs font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:text-[var(--color-espresso)]"
                      }`}
                    >
                      {filterTab.label} ({filterTab.count})
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => fetchAdminReports(reportFilter)}
                    title="Refresh Reports"
                    className="p-1.5 rounded-xl hover:bg-[var(--color-surface)] text-slate-500 hover:text-[var(--color-espresso)] transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} className={loadingReports ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* REPORTS TABLE */}
              <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-x-auto shadow-xs w-full">
                <table className="w-full text-left border-collapse min-w-[750px] text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] text-xs text-slate-400 uppercase tracking-wider font-black">
                      <th className="px-6 py-4">Target Listing</th>
                      <th className="px-6 py-4">Reported By</th>
                      <th className="px-6 py-4">Violation & Reason</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status & Audit</th>
                      <th className="px-6 py-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingReports ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[var(--color-brand-primary)]" />
                          <span className="text-xs font-bold">Loading live moderation reports from database...</span>
                        </td>
                      </tr>
                    ) : filteredReports.length > 0 ? (
                      filteredReports.map((rep) => {
                        const listing = rep.targetListing;
                        const listingTitle = listing?.title || "Listing Removed / Unavailable";
                        const listingImg = listing?.images?.[0];
                        const isListingActive = listing?.isActive !== false;
                        const reporterName = rep.reporter?.name || "Anonymous Member";
                        const reporterEmail = rep.reporter?.email || "";
                        const categoryMeta = REPORT_CATEGORY_META[rep.category] || {
                          label: rep.category || "General",
                          badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
                        };
                        const dateStr = rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : "Recent";
                        const isPendingOrInvestigating = rep.status === "pending" || rep.status === "investigating";

                        return (
                          <tr
                            key={rep._id}
                            className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                          >
                            {/* Target Listing */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {listingImg ? (
                                  <img
                                    src={listingImg}
                                    alt={listingTitle}
                                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[var(--color-border-subtle)]"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-slate-400 shrink-0">
                                    <Building2 size={20} />
                                  </div>
                                )}
                                <div className="min-w-0 max-w-xs">
                                  {listing?._id ? (
                                    <Link
                                      to={`/listings/${listing._id}`}
                                      className="font-bold text-sm text-[var(--color-espresso)] hover:text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1.5 truncate max-w-full"
                                    >
                                      <span className="truncate">{listingTitle}</span>
                                      <ExternalLink size={12} className="shrink-0 opacity-60" />
                                    </Link>
                                  ) : (
                                    <span className="font-bold text-sm text-slate-400 line-through">
                                      {listingTitle}
                                    </span>
                                  )}
                                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                    {listing?.rentalPricePerDay && (
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        ₹{Number(listing.rentalPricePerDay).toLocaleString("en-IN")}/day
                                      </span>
                                    )}
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${
                                        isListingActive
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                          : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                      }`}
                                    >
                                      {isListingActive ? "Active" : "Paused"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Reported By */}
                            <td className="px-6 py-4">
                              <div className="font-bold text-[var(--color-espresso)] text-sm">{reporterName}</div>
                              {reporterEmail && <div className="text-xs text-slate-400">{reporterEmail}</div>}
                            </td>

                            {/* Violation & Reason */}
                            <td className="px-6 py-4 max-w-md">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-1.5 ${categoryMeta.badge}`}
                              >
                                {categoryMeta.label}
                              </span>
                              <p className="text-xs text-[var(--color-espresso)] font-medium line-clamp-3">
                                {rep.reason}
                              </p>
                              {rep.adminNotes && (
                                <div className="mt-1.5 p-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] text-[11px] text-slate-600 dark:text-slate-400">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">Admin Note: </span>
                                  {rep.adminNotes}
                                </div>
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{dateStr}</td>

                            {/* Status & Audit */}
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                  rep.status === "resolved"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : rep.status === "investigating"
                                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                    : rep.status === "dismissed"
                                    ? "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {rep.status}
                              </span>
                              {rep.actionTaken && rep.actionTaken !== "none" && (
                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                  {rep.actionTaken === "listing_paused"
                                    ? "⏸️ Listing Paused"
                                    : rep.actionTaken === "warning_sent"
                                    ? "⚠️ Warned"
                                    : rep.actionTaken}
                                </div>
                              )}
                            </td>

                            {/* Moderation Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {isPendingOrInvestigating ? (
                                  <>
                                    {isListingActive && listing?._id && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickPauseListing(rep)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer shadow-xs"
                                        title="Freeze listing immediately in database"
                                      >
                                        <Pause size={12} />
                                        <span>Pause Item</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenActionModal(rep, "resolved")}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all cursor-pointer shadow-xs"
                                    >
                                      <Check size={12} />
                                      <span>Resolve</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickDismissReport(rep)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-[var(--color-surface-secondary)] text-xs font-bold transition-all cursor-pointer"
                                      title="Dismiss report without penalty"
                                    >
                                      <X size={12} />
                                      <span>Dismiss</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenActionModal(rep, rep.status)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                                  >
                                    <FileText size={13} />
                                    <span>Audit Details</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <ShieldCheck size={36} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                          <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">
                            {searchQuery ? "No reports match your search query." : "No moderation flags found."}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {searchQuery ? "Try clearing search filters." : "Your platform listings are operating smoothly without open flags."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* ======================================================== */}
      {/* ADD / EDIT CATEGORY MODAL WITH INTERACTIVE EMOJI PICKER   */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !modalSubmitting && setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] p-6 sm:p-7 shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-5">
                <div>
                  <h3 className="text-lg font-black text-[var(--color-espresso)] tracking-tight">
                    {editingCategory ? "Edit Category" : "Create New Category"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingCategory
                      ? "Update category details and emoji stored in MongoDB."
                      : "Add a new category with an icon to store in the database."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSubmitting}
                  className="p-1.5 rounded-full text-slate-400 hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error Message */}
              {modalError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleCategorySubmit} className="space-y-5">
                {/* Live Card Mock Preview */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-xs shrink-0">
                    {modalFormData.icon || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Live Preview
                    </span>
                    <h4 className="font-bold text-sm text-[var(--color-espresso)] truncate">
                      {modalFormData.name.trim() || "Category Name"}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {modalFormData.description.trim() || "Items and equipment description..."}
                    </p>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Camera & Photography, Camping Equipment"
                    value={modalFormData.name}
                    onChange={(e) => setModalFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all font-medium"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1.5">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description for renters and hosts..."
                    value={modalFormData.description}
                    onChange={(e) => setModalFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all font-medium resize-none"
                  />
                </div>

                {/* INTERACTIVE EMOJI PICKER */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[var(--color-espresso)]">
                      Select Emoji / Icon <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Custom:</span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Emoji"
                        value={modalFormData.icon}
                        onChange={(e) => setModalFormData((prev) => ({ ...prev, icon: e.target.value }))}
                        className="w-14 text-center px-1.5 py-1 text-base rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-brand-primary)]"
                      />
                    </div>
                  </div>

                  {/* Grid of Preset Emojis */}
                  <div className="grid grid-cols-6 gap-2 p-2.5 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-border-subtle)] max-h-40 overflow-y-auto">
                    {PRESET_EMOJIS.map((item) => {
                      const isSelected = modalFormData.icon === item.emoji;
                      return (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => setModalFormData((prev) => ({ ...prev, icon: item.emoji }))}
                          title={item.label}
                          className={`h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[var(--color-surface)] border-2 border-[var(--color-brand-primary)] shadow-sm scale-105"
                              : "hover:bg-[var(--color-surface)] border border-transparent hover:border-slate-200"
                          }`}
                        >
                          {item.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={modalSubmitting}
                    className="px-4 py-2.5 rounded-full border border-[var(--color-border)] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-6 py-2.5 rounded-full bg-[var(--color-brand-primary)] text-white text-xs font-bold shadow-md shadow-rose-500/25 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {modalSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <span>{editingCategory ? "Update Category" : "Save Category"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ======================================================== */}
        {/* REPORT ACTION & AUDIT MODAL                              */}
        {/* ======================================================== */}
        {actionModal.open && actionModal.report && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !actionModal.submitting && setActionModal((prev) => ({ ...prev, open: false }))}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] p-6 sm:p-7 shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-5">
                <div>
                  <h3 className="text-lg font-black text-[var(--color-espresso)] tracking-tight">
                    Review & Moderate Report
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update report status, execute safety enforcement, and record audit notes in MongoDB.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}
                  disabled={actionModal.submitting}
                  className="p-1.5 rounded-full text-slate-400 hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Report Summary Card */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] space-y-2 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Target Listing
                  </span>
                  <span className="text-xs font-bold text-[var(--color-espresso)]">
                    {actionModal.report.targetListing?.title || "Listing Removed"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reported By:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {actionModal.report.reporter?.name || "Community Member"}
                  </span>
                </div>
                <div className="text-xs bg-[var(--color-surface)] p-2.5 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-espresso)] font-medium">
                  <span className="font-bold text-rose-600 block mb-0.5">Report Reason:</span>
                  {actionModal.report.reason}
                </div>
              </div>

              {/* Form Controls */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReportAction(
                    actionModal.report._id,
                    actionModal.nextStatus,
                    actionModal.actionTaken,
                    actionModal.adminNotes
                  );
                }}
                className="space-y-4"
              >
                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1.5">
                    Report Status
                  </label>
                  <select
                    value={actionModal.nextStatus}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, nextStatus: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 font-medium"
                  >
                    <option value="resolved">Resolved (Close Case)</option>
                    <option value="investigating">Investigating (Keep Open)</option>
                    <option value="dismissed">Dismissed (No Violation)</option>
                    <option value="pending">Pending (Awaiting Action)</option>
                  </select>
                </div>

                {/* Enforcement Action Selection */}
                <div>
                  <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1.5">
                    Enforcement Action
                  </label>
                  <select
                    value={actionModal.actionTaken}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, actionTaken: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 font-medium"
                  >
                    <option value="none">None / Information Only</option>
                    <option value="listing_paused">⏸️ Pause Listing (Immediately freeze in database)</option>
                    <option value="warning_sent">⚠️ Warn Host (Safety notification dispatched)</option>
                    <option value="dismissed">❌ Dismiss Report</option>
                  </select>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1.5">
                    Internal Admin Notes <span className="text-slate-400 font-normal">(Audit Trail)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter details of review findings, communication with host, or justification..."
                    value={actionModal.adminNotes}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, adminNotes: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 resize-none font-medium"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}
                    disabled={actionModal.submitting}
                    className="px-4 py-2.5 rounded-full border border-[var(--color-border)] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionModal.submitting}
                    className="px-6 py-2.5 rounded-full bg-[var(--color-brand-primary)] text-white text-xs font-bold shadow-md shadow-rose-500/25 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionModal.submitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Updating Database...</span>
                      </>
                    ) : (
                      <span>Apply Moderation Action</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
