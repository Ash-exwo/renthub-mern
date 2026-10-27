import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  Layers,
  HelpCircle,
} from "lucide-react";
import Container from "../../components/Container";
import { Button } from "../../components/ui";

const FAQS = [
  {
    q: "How does damage protection work?",
    a: "Every rental made on RentHub includes our complimentary ₹1,00,000 Damage Protection. In the rare event of accidental damage during an active rental, RentHub investigates and compensates verified repair or replacement costs without friction.",
  },
  {
    q: "When do I get my security deposit back?",
    a: "Security deposits are held in a safe digital escrow during your rental. Within 24 hours of returning the item in good condition, the host completes the return inspection and the full deposit is automatically unlocked to your payment method.",
  },
  {
    q: "How do owners get paid?",
    a: "Owners receive rental earnings directly into their verified bank account 24 hours after the renter receives the item. RentHub charges a modest 5% platform fee to cover insurance, payment processing, and 24/7 community support.",
  },
  {
    q: "What if an item is not as described?",
    a: "RentHub operates a 100% Satisfaction Guarantee. If an item or space differs significantly from its listing description, you have 12 hours from pickup/delivery to report it and receive an immediate replacement or full refund.",
  },
];

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="py-10 sm:py-16 flex flex-col gap-14 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="ambient-glow-wrapper absolute inset-0 pointer-events-none opacity-40" />

      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 mb-5 shadow-xs">
            <Sparkles size={14} className="text-[var(--color-brand-primary)]" />
            <span>Transparent Rental Platform</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-3xl sm:text-5xl font-black text-[var(--color-espresso)] mb-4 tracking-tight">
            Renting made simple, <span className="gradient-text">transparent & safe</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-secondary-text)] leading-relaxed">
            Everything you need to know about booking verified rentals and listing your own gear on RentHub with built-in digital escrow.
          </p>
        </div>

        {/* 2-Column Split: For Renters vs For Hosts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Renters Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-7 sm:p-9 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-[var(--color-brand-primary)]/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">
                  For Renters
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-[var(--color-brand-primary)] border border-rose-500/20">
                  Instant Access
                </span>
              </div>
              <h2 className="font-[var(--font-heading)] text-2xl font-black text-[var(--color-espresso)] mb-6">
                How to Rent on RentHub
              </h2>

              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-[var(--color-brand-primary)] flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    01
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Find what you need</h4>
                    <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">
                      Filter by category, city, and dates. Review owner ratings, specifications, and verified condition before booking.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-[var(--color-brand-primary)] flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    02
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Book with transparent escrow</h4>
                    <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">
                      See exact daily rates, refundable security deposit, and ₹1,00,000 protection upfront. Funds stay locked safely in escrow.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-[var(--color-brand-primary)] flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    03
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Pickup, enjoy & return</h4>
                    <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">
                      Coordinate pickup via built-in encrypted chat. Hand the asset back safely when finished to unlock your deposit automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
              <Link to="/explore">
                <Button variant="primary" fullWidth size="lg" icon={Search}>
                  Explore Rentals
                </Button>
              </Link>
            </div>
          </div>

          {/* Hosts Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-7 sm:p-9 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  For Owners & Hosts
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Earn Recurring Income
                </span>
              </div>
              <h2 className="font-[var(--font-heading)] text-2xl font-black text-[var(--color-espresso)] mb-6">
                How to Earn as a Host
              </h2>

              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    01
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">List your asset in minutes</h4>
                    <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">
                      Upload high-res photos, set your custom daily price, required security deposit, and custom rental rules.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    02
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Accept verified bookings</h4>
                    <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">
                      Review renter trust scores and inquiries. Accept bookings and coordinate exchange times seamlessly through chat.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    03
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Get paid with zero fraud risk</h4>
                    <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">
                      Direct bank payouts with ₹1,00,000 damage coverage backing your high-value assets on every single transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
              <Link to="/listings/new">
                <Button variant="secondary" fullWidth size="lg" icon={ArrowRight} iconPosition="right">
                  + List an Item
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Guarantees Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--color-espresso)]">₹1,00,000 Protection</div>
              <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">Automated coverage for equipment and assets.</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--color-espresso)]">Escrow Vault Custody</div>
              <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">Deposits safely protected until returns are confirmed.</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--color-espresso)]">Fast Digital Verification</div>
              <div className="text-xs text-[var(--color-muted-grey)] mt-0.5">Government ID and phone check for every user.</div>
            </div>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-wider mb-2">
              <HelpCircle size={14} />
              <span>Got Questions?</span>
            </div>
            <h2 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[var(--color-muted-grey)] mt-1">
              Have questions about security, deposits, or payouts? We're here to help.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`bg-[var(--color-surface)] border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? "border-[var(--color-brand-primary)]/40 shadow-md"
                      : "border-[var(--color-border)] shadow-xs"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full p-5 flex justify-between items-center text-left font-bold text-sm text-[var(--color-espresso)] cursor-pointer hover:bg-[var(--color-surface-subtle)] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[var(--color-muted-grey)] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[var(--color-brand-primary)]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-[var(--color-secondary-text)] leading-relaxed border-t border-[var(--color-border-subtle)] pt-3 bg-[var(--color-surface-subtle)]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
