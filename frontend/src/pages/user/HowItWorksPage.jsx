import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import Container from "../../components/Container";
import { Button, Card, Badge } from "../../components/ui";

const FAQS = [
  {
    q: "How does damage protection work?",
    a: "Every rental made on RentHub includes our complimentary ₹50,000 Damage Protection. In the rare event of accidental damage during an active rental, RentHub investigates and compensates verified repair or replacement costs.",
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
    <div className="py-8 sm:py-16 flex flex-col gap-14">
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="primary" size="md" className="mb-4">
            Platform Guide
          </Badge>
          <h1 className="font-[var(--font-heading)] text-3xl sm:text-5xl font-extrabold text-[var(--color-espresso)] mb-4">
            Renting made simple, transparent & safe
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-secondary-text)] leading-relaxed">
            Everything you need to know about booking rentals and listing your own spaces or gear on RentHub.
          </p>
        </div>

        {/* 2-Column Guide: For Renters vs For Hosts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Renters Card */}
          <Card padding="lg" className="border-t-4 border-t-[var(--color-terracotta)]">
            <span className="text-xs font-bold text-[var(--color-terracotta)] uppercase tracking-wider">
              For Renters
            </span>
            <h2 className="text-xl font-bold text-[var(--color-espresso)] my-3">How to Rent on RentHub</h2>

            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-terracotta)] grid place-items-center font-bold text-xs shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Find what you need</h4>
                  <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">Filter by category, city, and dates. Review owner ratings, specifications, and house rules.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-terracotta)] grid place-items-center font-bold text-xs shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Book with transparent pricing</h4>
                  <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">See exact daily rates, refundable security deposit, and protection coverage upfront. No hidden surprises.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-terracotta)] grid place-items-center font-bold text-xs shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Pickup, enjoy & return</h4>
                  <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">Coordinate pickup or delivery via built-in chat. Hand it back when finished to unlock your deposit.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/explore">
                <Button variant="primary" fullWidth icon={Search}>
                  Browse Rentals Now
                </Button>
              </Link>
            </div>
          </Card>

          {/* Hosts Card */}
          <Card padding="lg" className="border-t-4 border-t-[var(--color-espresso)]">
            <span className="text-xs font-bold text-[var(--color-espresso)] uppercase tracking-wider">
              For Owners & Hosts
            </span>
            <h2 className="text-xl font-bold text-[var(--color-espresso)] my-3">How to Earn as a Host</h2>

            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-espresso)] grid place-items-center font-bold text-xs shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">List your asset in minutes</h4>
                  <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">Upload high-res photos, set your daily price, required security deposit, and custom rental rules.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-espresso)] grid place-items-center font-bold text-xs shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Accept verified bookings</h4>
                  <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">Review renter profiles and inquiries. Accept bookings and coordinate exchange times seamlessly.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-espresso)] grid place-items-center font-bold text-xs shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-espresso)] mb-1">Get paid securely</h4>
                  <p className="text-xs text-[var(--color-muted-grey)] leading-relaxed">Direct bank deposit with ₹50,000 damage coverage backing your assets on every single rental.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/listings/new">
                <Button variant="secondary" fullWidth icon={ArrowRight} iconPosition="right">
                  Create a Listing
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-bold text-[var(--color-espresso)] mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[var(--color-muted-grey)]">
              Have questions about safety, deposits, or payouts? We're here to help.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full p-4 sm:p-5 flex justify-between items-center text-left font-bold text-sm text-[var(--color-espresso)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[var(--color-muted-grey)] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-[var(--color-secondary-text)] leading-relaxed border-t border-[var(--color-border-subtle)] pt-3">
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
