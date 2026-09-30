import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Clock, Sparkles, Heart, Home } from "lucide-react";
import Container from "./Container";

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] pt-12 sm:pt-16 pb-8 transition-colors duration-200 mt-auto">
      <Container>
        {/* Marketplace Guarantees Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pb-12 mb-12 border-b border-[var(--color-border)]">
          <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/30 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[var(--color-brand-primary)] border border-rose-200/60 dark:border-rose-900/40 grid place-items-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--color-espresso)] font-[var(--font-heading)]">Damage Shield & Escrow</div>
              <div className="text-xs text-[var(--color-muted-grey)] mt-1 leading-relaxed">Every rental secured by digital escrow and protected up to ₹1,00,000.</div>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/30 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-900/40 grid place-items-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--color-espresso)] font-[var(--font-heading)]">Instant Booking Engine</div>
              <div className="text-xs text-[var(--color-muted-grey)] mt-1 leading-relaxed">Rent by the day, week, or month with seamless instant verification.</div>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/30 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 grid place-items-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--color-espresso)] font-[var(--font-heading)]">100% Verified Community</div>
              <div className="text-xs text-[var(--color-muted-grey)] mt-1 leading-relaxed">Government ID verified owners, honest community ratings, zero scams.</div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-12 border-b border-[var(--color-border)]">
          {/* Col 1: Brand Info (Matching Navbar Header Branding) */}
          <div>
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
            <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed mt-3.5 max-w-sm">
              RentHub is the modern rental marketplace for discovering, renting, and monetizing properties, cameras, tech gear, vehicles, and equipment with total escrow confidence.
            </p>
          </div>

          {/* Col 2: Popular Categories */}
          <div>
            <h4 className="font-[var(--font-heading)] font-extrabold text-xs uppercase tracking-wider text-[var(--color-espresso)] mb-4">Popular Rentals</h4>
            <ul className="space-y-3 text-xs text-[var(--color-secondary-text)]">
              <li><Link to="/explore?category=Apartments" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Apartments & Stays</Link></li>
              <li><Link to="/explore?category=Vehicles" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Cars, EVs & Bikes</Link></li>
              <li><Link to="/explore?category=Cameras" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Cameras, Drones & Lenses</Link></li>
              <li><Link to="/explore?category=Tools" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Power Tools & Machinery</Link></li>
              <li><Link to="/explore?category=Electronics" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Consoles, Audio & Audio Gear</Link></li>
            </ul>
          </div>

          {/* Col 3: Platform & Trust */}
          <div>
            <h4 className="font-[var(--font-heading)] font-extrabold text-xs uppercase tracking-wider text-[var(--color-espresso)] mb-4">Platform</h4>
            <ul className="space-y-3 text-xs text-[var(--color-secondary-text)]">
              <li><Link to="/how-it-works" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">How It Works</Link></li>
              <li><Link to="/explore" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Browse All Rentals</Link></li>
              <li><Link to="/owner/dashboard" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Host Console & Earnings</Link></li>
              <li><Link to="/admin/login" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Admin Moderation</Link></li>
            </ul>
          </div>

          {/* Col 4: Support & Security */}
          <div>
            <h4 className="font-[var(--font-heading)] font-extrabold text-xs uppercase tracking-wider text-[var(--color-espresso)] mb-4">Security & Escrow</h4>
            <ul className="space-y-3 text-xs text-[var(--color-secondary-text)]">
              <li><Link to="/how-it-works" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Digital Escrow Policy</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">₹1,00,000 Damage Protection</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Instant Refund Guidelines</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[var(--color-brand-primary)] transition-colors duration-150">Community Code of Conduct</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--color-muted-grey)]">
          <p>© {new Date().getFullYear()} RentHub Marketplace Network. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link to="/how-it-works" className="hover:text-[var(--color-espresso)] transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/how-it-works" className="hover:text-[var(--color-espresso)] transition-colors">Terms of Service</Link>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              Crafted with <Heart size={12} className="fill-[var(--color-brand-primary)] text-[var(--color-brand-primary)]" /> for modern renters & hosts
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
