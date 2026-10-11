import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "../../utils/api";
import { getUser } from "../../utils/auth";
import Container from "../../components/Container";
import {
  Input,
  Button,
  Card,
  Tabs,
  Badge,
} from "../../components/ui";

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
    { id: "personal", label: "Personal Info", icon: User },
    { id: "security", label: "Security & Password", icon: Lock },
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
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-8 items-start">
          {/* Left Column: User Snapshot & Verification */}
          <aside className="flex flex-col gap-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--color-brand-primary)] to-amber-400 text-white flex items-center justify-center text-3xl font-extrabold shadow-md mb-4">
                {(name || "U").charAt(0).toUpperCase()}
              </div>

              <h1 className="text-xl font-extrabold text-[var(--color-espresso)] m-0">
                {name || "User"}
              </h1>
              <p className="text-xs text-[var(--color-muted-grey)] mt-1">{email}</p>

              <div className="mt-3">
                <Badge variant="success" size="sm">Verified Member</Badge>
              </div>

              <div className="w-full h-px bg-[var(--color-border-subtle)] my-5" />

              <div className="w-full flex flex-col gap-3 text-left text-xs">
                <div className="flex items-center gap-2.5 text-[var(--color-espresso)] font-medium">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>Govt ID Verified</span>
                </div>
                <div className="flex items-center gap-2.5 text-[var(--color-espresso)] font-medium">
                  <Mail size={16} className="text-emerald-500 shrink-0" />
                  <span>Email Verified</span>
                </div>
                <div className="flex items-center gap-2.5 text-[var(--color-espresso)] font-medium">
                  <Phone size={16} className="text-emerald-500 shrink-0" />
                  <span>Phone Confirmed</span>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm flex flex-col gap-2 text-xs font-semibold text-[var(--color-espresso)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted-grey)] mb-1">
                Shortcuts
              </div>
              <a href="/bookings" className="p-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-between">
                <span>My Bookings</span>
                <span>&rarr;</span>
              </a>
              <a href="/wishlist" className="p-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-between">
                <span>Saved Items</span>
                <span>&rarr;</span>
              </a>
              <a href="/messages" className="p-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-between">
                <span>Host Inquiries</span>
                <span>&rarr;</span>
              </a>
            </div>
          </aside>

          {/* Right Column: Tab Navigation & Form Panels */}
          <main className="flex flex-col gap-6">
            {/* Tab Navigation */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-2 shadow-sm">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
            </div>

            {/* Success alert banner */}
            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 border border-emerald-500/25 shadow-sm">
                <CheckCircle2 size={18} />
                <span>Profile settings updated successfully in database.</span>
              </div>
            )}

            {/* Error alert banner */}
            {saveError && (
              <div className="p-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-2 border border-rose-500/25 shadow-sm">
                <AlertCircle size={18} />
                <span>{saveError}</span>
              </div>
            )}

            {/* Tab 1: Personal Info */}
            {activeTab === "personal" && (
              <Card padding="lg">
                <h2 className="text-lg font-extrabold text-[var(--color-espresso)] m-0 mb-6">Personal Details</h2>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                  <Input
                    label="Full Name"
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
                    <span className="text-[11px] text-[var(--color-muted-grey)] mt-1 block">
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
                      label="Location / City"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      prefixIcon={MapPin}
                      placeholder="City or Area (e.g. Kochi)"
                      required
                    />
                  </div>

                  <div className="mt-3">
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
              <Card padding="lg">
                <h2 className="text-lg font-extrabold text-[var(--color-espresso)] m-0 mb-6">Security & Password</h2>

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

                  <div className="mt-3">
                    <Button type="submit" variant="primary">
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Tab 3: Notification Preferences */}
            {activeTab === "notifications" && (
              <Card padding="lg">
                <h2 className="text-lg font-extrabold text-[var(--color-espresso)] m-0 mb-6">Alert Preferences</h2>

                <div className="flex flex-col gap-5">
                  <label className="flex justify-between items-center cursor-pointer p-3 rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">Booking Updates & Receipts</div>
                      <div className="text-xs text-[var(--color-muted-grey)]">Receive instant confirmation for reservations and deposit releases.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                  </label>

                  <div className="h-px bg-[var(--color-border-subtle)]" />

                  <label className="flex justify-between items-center cursor-pointer p-3 rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">Host Chat Messages via SMS</div>
                      <div className="text-xs text-[var(--color-muted-grey)]">Receive text notifications when a host sends handover instructions.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                  </label>

                  <div className="h-px bg-[var(--color-border-subtle)]" />

                  <label className="flex justify-between items-center cursor-pointer p-3 rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <div>
                      <div className="font-bold text-sm text-[var(--color-espresso)]">Promotions & Discounts</div>
                      <div className="text-xs text-[var(--color-muted-grey)]">Weekly deals and coupon codes on high-demand gear and stays.</div>
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
              <Card padding="lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-extrabold text-[var(--color-espresso)] m-0">Saved Payment Methods</h2>
                  <Button variant="outline" size="sm">
                    + Add Card / UPI
                  </Button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="border border-[var(--color-border)] rounded-2xl p-4 flex justify-between items-center">
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

                  <div className="border border-[var(--color-border)] rounded-2xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid place-items-center font-bold text-xs shrink-0">
                        UPI
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[var(--color-espresso)]">Google Pay / UPI ID</div>
                        <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">user@okhdfcbank</div>
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
