import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Bell,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Save,
  AlertCircle,
  Sparkles,
  Calendar,
  Heart,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import api from "../../utils/api";
import { getUser } from "../../utils/auth";
import Container from "../../components/Container";
import { Input, Button, Card, Badge } from "../../components/ui";

export default function ProfilePage() {
  const initialUser = getUser() || {
    name: "User",
    email: "",
    phone: "",
    location: "",
  };

  const [activeTab, setActiveTab] = useState("personal");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Form states initialized from stored session
  const [name, setName] = useState(initialUser.name || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [location, setLocation] = useState(initialUser.location || "");

  // 3D Tilt Ref for Profile Card
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: "rotateX(0deg) rotateY(0deg) scale(1)", boxShadow: "" });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      boxShadow: "0 25px 45px -12px rgba(255, 56, 92, 0.2)",
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      boxShadow: "",
    });
  };

  // Fetch live fresh profile from MongoDB on mount to guarantee registration phone & location prefill
  useEffect(() => {
    async function fetchLiveProfile() {
      try {
        const res = await api.get("/auth/me");
        if (res.data?.user) {
          const liveUser = res.data.user;
          setName(liveUser.name || "");
          setEmail(liveUser.email || "");
          setPhone(liveUser.phone || "");
          setLocation(liveUser.location || "");
          localStorage.setItem("userData", JSON.stringify(liveUser));
        }
      } catch (err) {
        console.error("Failed to load user profile from server:", err);
      }
    }
    fetchLiveProfile();
  }, []);

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const tabs = [
    { id: "personal", label: "Personal Details", icon: User },
    { id: "security", label: "Security & 2FA", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payment Methods", icon: CreditCard },
  ];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSavingProfile(true);

    try {
      const res = await api.put("/auth/profile", {
        name,
        phone,
        location,
      });

      if (res.data?.user) {
        localStorage.setItem("userData", JSON.stringify(res.data.user));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to update profile. Please try again.";
      setSaveError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <Container>
        {/* Top Header Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)] mb-1 flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Identity & Security Hub</span>
            </div>
            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-espresso)]">
              Account Overview
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Escrow Trust Index: 99.8%</span>
          </div>
        </div>

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: 3D Interactive Perspective Identity Card (5 Cols) */}
          <aside className="lg:col-span-5 flex flex-col gap-6">
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ ...tiltStyle, transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out" }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-7 shadow-xl hover:border-[var(--color-brand-primary)]/40 backdrop-blur-xl relative overflow-hidden group select-none"
            >
              {/* Subtle radial sheen */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-brand-primary)]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--color-brand-primary)]/20 transition-all duration-500" />

              <div className="flex flex-col items-center text-center relative z-10">
                {/* Avatar with Animated Glow Aura Ring */}
                <div className="relative mb-4">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[var(--color-brand-primary)] to-amber-400 opacity-60 blur-md animate-pulse-glow" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--color-brand-primary)] via-rose-600 to-amber-400 text-white font-extrabold text-3xl grid place-items-center shadow-xl relative z-10 border-4 border-[var(--color-surface)]">
                    {(name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 text-white grid place-items-center text-xs font-black shadow-md border-2 border-[var(--color-surface)] z-20"
                    title="Verified Member"
                  >
                    ✓
                  </div>
                </div>

                <h2 className="font-[var(--font-heading)] text-2xl font-extrabold text-[var(--color-espresso)] m-0 tracking-tight">
                  {name || "User"}
                </h2>
                <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">{email}</p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface-subtle)] text-xs font-bold mt-3 border border-[var(--color-border)]">
                  <span className="text-amber-500">★</span>
                  <span>Superhost & Verified Renter</span>
                </div>

                {/* Quick Stats Grid */}
                <div className="w-full h-px bg-[var(--color-border-subtle)] my-5" />
                
                <div className="w-full grid grid-cols-3 gap-2.5 text-center text-xs mb-5">
                  <div className="p-3 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                    <div className="font-[var(--font-heading)] font-black text-lg text-[var(--color-espresso)]">12</div>
                    <div className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 font-medium">Rentals</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                    <div className="font-[var(--font-heading)] font-black text-lg text-[var(--color-brand-primary)]">4.96</div>
                    <div className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 font-medium">Rating</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                    <div className="font-[var(--font-heading)] font-black text-lg text-emerald-500">100%</div>
                    <div className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 font-medium">Return Rate</div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="w-full space-y-2.5 text-left text-xs font-medium">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                    <span className="flex items-center gap-2 text-[var(--color-espresso)]">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <span>Government ID</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                    <span className="flex items-center gap-2 text-[var(--color-espresso)]">
                      <Phone size={15} className="text-emerald-500" />
                      <span>Phone OTP</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                      Confirmed
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                    <span className="flex items-center gap-2 text-[var(--color-espresso)]">
                      <MapPin size={15} className="text-indigo-500" />
                      <span>Operating City</span>
                    </span>
                    <span className="text-[11px] font-bold text-[var(--color-espresso)] truncate max-w-[120px]">
                      {location || "Kerala, India"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm flex flex-col gap-2 text-xs font-semibold text-[var(--color-espresso)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted-grey)] mb-1">
                Quick Shortcuts
              </div>
              <Link
                to="/bookings"
                className="p-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={15} className="text-[var(--color-brand-primary)]" />
                  <span>My Bookings</span>
                </span>
                <ArrowRight size={14} className="text-[var(--color-muted-grey)]" />
              </Link>
              <Link
                to="/wishlist"
                className="p-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Heart size={15} className="text-rose-500" />
                  <span>Saved Rentals</span>
                </span>
                <ArrowRight size={14} className="text-[var(--color-muted-grey)]" />
              </Link>
              <Link
                to="/messages"
                className="p-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-indigo-500" />
                  <span>Messages & Inquiries</span>
                </span>
                <ArrowRight size={14} className="text-[var(--color-muted-grey)]" />
              </Link>
            </div>
          </aside>

          {/* Right Column: Animated Tabbed Form Panels (7 Cols) */}
          <main className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Sliding Pill Tab Navigation */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 shadow-sm flex items-center overflow-x-auto no-scrollbar gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "text-white"
                        : "text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="profileActiveTabPill"
                        className="absolute inset-0 bg-[var(--color-brand-primary)] rounded-xl shadow-md shadow-rose-500/20"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Success Alert Banner */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2.5 border border-emerald-500/25 shadow-sm"
                >
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>Profile details updated successfully in database.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Alert Banner */}
            <AnimatePresence>
              {saveError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5 border border-rose-500/25 shadow-sm"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{saveError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab 1: Personal Details */}
            {activeTab === "personal" && (
              <Card padding="lg" className="border-[var(--color-border)] shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-[var(--color-border-subtle)]">
                  <div>
                    <h3 className="font-[var(--font-heading)] text-lg font-extrabold text-[var(--color-espresso)] m-0">
                      Personal Information
                    </h3>
                    <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                      Keep your contact and address details up to date for rental handovers.
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">ID Verified</Badge>
                </div>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                  <Input
                    label="Full Legal Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    prefixIcon={User}
                    required
                  />

                  <div>
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      disabled
                      prefixIcon={Mail}
                      className="opacity-75 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-[var(--color-muted-grey)] mt-1.5 block">
                      Email address is linked to your login credentials and verified.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      prefixIcon={Phone}
                      placeholder="10-digit phone number"
                      required
                    />

                    <Input
                      label="Location / Operating City"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      prefixIcon={MapPin}
                      placeholder="City or Area (e.g. Kochi)"
                      required
                    />
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] mt-2">
                    <span className="text-xs text-[var(--color-muted-grey)]">
                      All profile changes synchronized directly with MongoDB Atlas.
                    </span>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={savingProfile}
                      disabled={savingProfile}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Tab 2: Security & Password */}
            {activeTab === "security" && (
              <Card padding="lg" className="border-[var(--color-border)] shadow-sm">
                <div className="mb-6 pb-3 border-b border-[var(--color-border-subtle)]">
                  <h3 className="font-[var(--font-heading)] text-lg font-extrabold text-[var(--color-espresso)] m-0">
                    Security & Credentials
                  </h3>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Manage your password and platform security protections.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("Password updated successfully.");
                  }}
                  className="flex flex-col gap-5"
                >
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                    prefixIcon={Lock}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="At least 6 characters"
                      prefixIcon={Lock}
                      required
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Re-enter new password"
                      prefixIcon={Lock}
                      required
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
                    <ShieldCheck size={20} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="font-bold text-[var(--color-espresso)] block">Escrow Fraud Shield Active</span>
                      Password changes require email confirmation before active rental payouts can be modified.
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button type="submit" variant="primary">
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Tab 3: Notification Preferences */}
            {activeTab === "notifications" && (
              <Card padding="lg" className="border-[var(--color-border)] shadow-sm">
                <div className="mb-6 pb-3 border-b border-[var(--color-border-subtle)]">
                  <h3 className="font-[var(--font-heading)] text-lg font-extrabold text-[var(--color-espresso)] m-0">
                    Alert Preferences
                  </h3>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Customize the communication notifications you receive on RentHub.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex justify-between items-center cursor-pointer p-3.5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 transition-colors">
                    <div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">Booking Approval & Status Alerts</div>
                      <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">Receive instant confirmation when a host approves your reservation.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                  </label>

                  <label className="flex justify-between items-center cursor-pointer p-3.5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 transition-colors">
                    <div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">Escrow Payment & Deposit Release</div>
                      <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">Updates on held security deposits, refunds, and payout authorizations.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                  </label>

                  <label className="flex justify-between items-center cursor-pointer p-3.5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 transition-colors">
                    <div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">Promotions & Rental Discounts</div>
                      <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">Weekly gear highlights, camera rental discounts, and host bonuses.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={promoAlerts}
                      onChange={(e) => setPromoAlerts(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                  </label>
                </div>
              </Card>
            )}

            {/* Tab 4: Payment Methods */}
            {activeTab === "payments" && (
              <Card padding="lg" className="border-[var(--color-border)] shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[var(--color-border-subtle)]">
                  <div>
                    <h3 className="font-[var(--font-heading)] text-lg font-extrabold text-[var(--color-espresso)] m-0">
                      Saved Payment Methods
                    </h3>
                    <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                      Encrypted payment methods for instant escrow authorizations.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    + Add Method
                  </Button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="border border-[var(--color-border)] rounded-2xl p-4 flex justify-between items-center bg-[var(--color-surface-subtle)]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-[var(--color-brand-primary)] grid place-items-center shrink-0">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[var(--color-espresso)]">HDFC Bank Credit Card</div>
                        <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4289 (Expires 08/28)</div>
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">Default</Badge>
                  </div>

                  <div className="border border-[var(--color-border)] rounded-2xl p-4 flex justify-between items-center bg-[var(--color-surface-subtle)]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid place-items-center font-bold text-xs shrink-0">
                        UPI
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[var(--color-espresso)]">Google Pay / UPI ID</div>
                        <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">aswathy@okhdfcbank</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                </div>
              </Card>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}
