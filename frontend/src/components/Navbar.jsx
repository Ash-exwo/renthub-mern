import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  User,
  Heart,
  Calendar,
  MessageSquare,
  Bell,
  Plus,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Compass,
  Layers,
  Home,
} from "lucide-react";
import Container from "./Container";
import ThemeToggle from "./ThemeToggle";
import { isLoggedIn, getUser, logout } from "../utils/auth";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isLoggedIn();
  const user = getUser();

  const isOwnerRoute =
    location.pathname.startsWith("/owner") ||
    location.pathname === "/my-listings" ||
    location.pathname === "/listings/new";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
    navigate("/login");
  };

  const navLinkClass = (path) =>
    `inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
      location.pathname === path
        ? "text-[var(--color-brand-primary)]"
        : "text-[var(--color-secondary-text)] hover:text-[var(--color-espresso)]"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--navbar-border)] transition-colors duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <Container>
        <div className="flex items-center justify-between h-[74px] gap-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline cursor-pointer select-none group"
            aria-label="RentHub Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[var(--color-brand-primary)] via-rose-500 to-amber-400 text-white grid place-items-center shadow-md shadow-rose-500/20 group-hover:scale-105 group-hover:rotate-2 transition-all duration-200">
              <Home size={19} className="text-white" />
            </div>
            <div className="font-[var(--font-heading)] text-2xl font-extrabold tracking-tight text-[var(--color-espresso)] flex items-baseline">
              <span>Rent</span>
              <span className="text-[var(--color-brand-primary)]">Hub</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-3.5 lg:gap-5 xl:gap-6">
            {loggedIn ? (
              isOwnerRoute ? (
                /* ===== Owner / Host Mode Desktop ===== */
                <>
                  <Link to="/owner/dashboard" className={navLinkClass("/owner/dashboard")}>
                    <LayoutDashboard size={16} />
                    <span>Host Console</span>
                  </Link>
                  <Link to="/my-listings" className={navLinkClass("/my-listings")}>
                    <Layers size={16} />
                    <span>Inventory</span>
                  </Link>
                  <Link to="/messages" className={navLinkClass("/messages")}>
                    <MessageSquare size={16} />
                    <span>Inquiries</span>
                  </Link>

                  <div className="w-px h-5 bg-[var(--color-border)]" />

                  <Link
                    to="/listings/new"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] !text-white shadow-md shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
                    style={{ color: "#ffffff" }}
                  >
                    <Plus size={16} />
                    <span>Publish Listing</span>
                  </Link>

                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-espresso)] hover:text-[var(--color-brand-primary)] px-3 py-1.5 rounded-full bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-all whitespace-nowrap"
                  >
                    <Compass size={14} />
                    <span>Renter Mode</span>
                  </Link>
                </>
              ) : (
                /* ===== Renter Mode Desktop ===== */
                <>
                  <Link to="/explore" className={navLinkClass("/explore")}>
                    <Compass size={16} />
                    <span>Explore Catalog</span>
                  </Link>
                  <Link to="/bookings" className={navLinkClass("/bookings")}>
                    <Calendar size={16} />
                    <span>My Bookings</span>
                  </Link>
                  <Link to="/wishlist" className={navLinkClass("/wishlist")} aria-label="Wishlist">
                    <Heart size={16} />
                    <span className="hidden lg:inline">Saved</span>
                  </Link>
                  <Link to="/messages" className={navLinkClass("/messages")} aria-label="Messages">
                    <MessageSquare size={16} />
                    <span className="hidden lg:inline">Messages</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className={`inline-flex items-center justify-center p-2 rounded-full relative transition-colors ${
                      location.pathname === "/notifications"
                        ? "text-[var(--color-brand-primary)] bg-[var(--color-brand-primary-subtle)]"
                        : "text-[var(--color-secondary-text)] hover:text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <Bell size={17} />
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-brand-primary)]"
                      aria-hidden="true"
                    />
                  </Link>

                  <div className="w-px h-5 bg-[var(--color-border)]" />

                  {/* Primary Quick-Action Button */}
                  <Link
                    to="/listings/new"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 sm:px-4 py-2 rounded-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] !text-white shadow-md shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
                    style={{ color: "#ffffff" }}
                  >
                    <Plus size={15} />
                    <span>Publish Rental</span>
                  </Link>

                  <Link
                    to="/owner/dashboard"
                    className="hidden xl:inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-espresso)] hover:text-[var(--color-brand-primary)] px-3 py-1.5 rounded-full bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-all whitespace-nowrap"
                  >
                    <Sparkles size={13} className="text-[var(--color-brand-primary)]" />
                    <span>Hosting</span>
                  </Link>
                </>
              )
            ) : (
              /* ===== Guest Mode Desktop ===== */
              <>
                <Link to="/explore" className={navLinkClass("/explore")}>
                  <span>Browse Catalog</span>
                </Link>
                <Link to="/how-it-works" className={navLinkClass("/how-it-works")}>
                  <span>How It Works</span>
                </Link>

                <div className="w-px h-5 bg-[var(--color-border)]" />

                <Link
                  to="/login"
                  className="text-sm font-semibold text-[var(--color-espresso)] hover:text-[var(--color-brand-primary)] transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4.5 py-2.5 rounded-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] !text-white shadow-md shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
                  style={{ color: "#ffffff" }}
                >
                  <span>Get Started</span>
                </Link>
              </>
            )}

            {/* Profile Menu Trigger */}
            {loggedIn && (
              <div className="relative ml-2" ref={profileRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 py-1 pl-1.5 pr-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] text-xs font-semibold cursor-pointer hover:border-[var(--color-brand-primary)] hover:shadow-sm transition-all duration-150"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--color-brand-primary)] to-amber-400 text-white font-bold text-xs grid place-items-center shadow-sm">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[6.5rem] truncate font-bold">{user?.name?.split(" ")[0] || "Account"}</span>
                  <ChevronDown
                    size={13}
                    className={`text-[var(--color-muted-grey)] transition-transform duration-150 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-60 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-2 flex flex-col z-50 backdrop-blur-xl"
                    role="menu"
                  >
                    <div className="px-3.5 py-2.5 border-b border-[var(--color-border-subtle)] mb-1">
                      <div className="font-extrabold text-sm text-[var(--color-espresso)]">
                        {user?.name || "User"}
                      </div>
                      <div className="text-xs text-[var(--color-muted-grey)] truncate mt-0.5">{user?.email}</div>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors duration-150 w-full text-left"
                      role="menuitem"
                    >
                      <User size={15} />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors duration-150 w-full text-left"
                      role="menuitem"
                    >
                      <Calendar size={15} />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/listings/new"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-subtle)] transition-colors duration-150 w-full text-left"
                      role="menuitem"
                    >
                      <Plus size={15} />
                      <span>Publish Rental</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors duration-150 w-full text-left"
                      role="menuitem"
                    >
                      <Heart size={15} />
                      <span>Saved Items</span>
                    </Link>
                    <Link
                      to="/my-listings"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors duration-150 w-full text-left"
                      role="menuitem"
                    >
                      <LayoutDashboard size={15} />
                      <span>Manage Listings</span>
                    </Link>
                    <Link
                      to="/owner/dashboard"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors duration-150 w-full text-left"
                      role="menuitem"
                    >
                      <Sparkles size={15} />
                      <span>Host Dashboard</span>
                    </Link>

                    <div className="h-px bg-[var(--color-border-subtle)] my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 transition-colors duration-150 w-full text-left cursor-pointer"
                      role="menuitem"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="pl-2 border-l border-[var(--color-border)]">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="grid place-items-center w-9 h-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-espresso)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors duration-150"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--navbar-border)] bg-[var(--color-surface)] py-4 pb-6 shadow-2xl">
          <Container>
            <div className="flex flex-col">
              {loggedIn ? (
                <>
                  <div className="flex items-center gap-3 pb-3.5 mb-3.5 border-b border-[var(--color-border-subtle)]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-brand-primary)] to-amber-400 text-white font-bold text-sm grid place-items-center shadow-sm">
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-base text-[var(--color-espresso)]">{user?.name || "User"}</div>
                      <div className="text-xs text-[var(--color-muted-grey)]">{user?.email}</div>
                    </div>
                  </div>

                  <div className="flex flex-col divide-y divide-[var(--color-border-subtle)] text-sm">
                    <Link to="/explore" className="py-2.5 font-semibold text-[var(--color-espresso)]">Explore Catalog</Link>
                    <Link to="/bookings" className="py-2.5 font-semibold text-[var(--color-espresso)]">My Bookings</Link>
                    <Link to="/wishlist" className="py-2.5 font-semibold text-[var(--color-espresso)]">Saved Rentals</Link>
                    <Link to="/messages" className="py-2.5 font-semibold text-[var(--color-espresso)]">Messages</Link>
                    <Link to="/notifications" className="py-2.5 font-semibold text-[var(--color-espresso)]">Notifications</Link>
                    <Link to="/profile" className="py-2.5 font-semibold text-[var(--color-espresso)]">Account Settings</Link>

                    <Link to="/listings/new" className="py-2.5 font-bold text-[var(--color-brand-primary)] flex items-center gap-1.5">
                      <Plus size={16} />
                      <span>Publish Rental</span>
                    </Link>
                    <Link to="/owner/dashboard" className="py-2.5 font-bold text-[var(--color-espresso)] hover:text-[var(--color-brand-primary)]">
                      Host Dashboard
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 pt-4 text-sm font-bold text-rose-600 cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col divide-y divide-[var(--color-border-subtle)] text-sm">
                  <Link to="/" className="py-2.5 font-semibold text-[var(--color-espresso)]">Home</Link>
                  <Link to="/explore" className="py-2.5 font-semibold text-[var(--color-espresso)]">Browse Catalog</Link>
                  <Link to="/how-it-works" className="py-2.5 font-semibold text-[var(--color-espresso)]">How It Works</Link>
                  <Link to="/login" className="py-2.5 font-semibold text-[var(--color-espresso)]">Sign In</Link>
                  <Link
                    to="/register"
                    className="py-3 text-base font-extrabold text-[var(--color-brand-primary)]"
                  >
                    Create Account &rarr;
                  </Link>
                </div>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

export default Navbar;
