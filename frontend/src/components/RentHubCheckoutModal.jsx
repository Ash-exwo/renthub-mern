import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Sparkles,
  CalendarDays,
  Receipt,
} from "lucide-react";
import api from "../utils/api";
import { Button, PriceDisplay } from "./ui";

export default function RentHubCheckoutModal({
  bookingId,
  isOpen,
  onClose,
  onPaymentSuccess,
}) {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const [activeTab, setActiveTab] = useState("card"); // 'card' | 'upi' | 'netbanking'
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardName, setCardName] = useState("RentHub User");
  const [upiId, setUpiId] = useState("renter@okaxis");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentError, setPaymentError] = useState("");

  // Load checkout session data
  useEffect(() => {
    if (isOpen && bookingId) {
      setLoadingSession(true);
      setSessionError("");
      setPaymentSuccess(false);
      setPaymentResult(null);
      setPaymentError("");

      api
        .post("/payments/checkout-session", { bookingId })
        .then((res) => {
          setSession(res.data);
        })
        .catch((err) => {
          console.error("Failed to load checkout session:", err);
          setSessionError(
            err.response?.data?.message || "Failed to initiate payment session."
          );
        })
        .finally(() => {
          setLoadingSession(false);
        });
    }
  }, [isOpen, bookingId]);

  const handlePayNow = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentError("");

    try {
      // Artificial delay (1.2s) to emulate payment gateway verification
      await new Promise((r) => setTimeout(r, 1200));

      let paymentDetails = {};
      if (activeTab === "card") {
        paymentDetails = {
          cardLast4: cardNumber.replace(/\s/g, "").slice(-4) || "4242",
          cardBrand: "Visa",
        };
      } else if (activeTab === "upi") {
        paymentDetails = { upiId };
      } else {
        paymentDetails = { bankName: selectedBank };
      }

      const res = await api.post("/payments/process", {
        bookingId,
        paymentMethod: activeTab,
        paymentDetails,
      });

      setPaymentResult(res.data);
      setPaymentSuccess(true);
      if (onPaymentSuccess) onPaymentSuccess(res.data);
    } catch (err) {
      console.error("Payment processing error:", err);
      setPaymentError(
        err.response?.data?.message || "Payment authorization failed. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid place-items-center">
              <Lock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[var(--color-espresso)]">
                  RentHub Escrow Checkout
                </h3>
              </div>
              <p className="text-xs text-[var(--color-muted-grey)]">
                256-Bit Encrypted Platform Escrow Protection
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-muted-grey)] disabled:opacity-40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {loadingSession ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-[var(--color-muted-grey)]">
                Initializing secure escrow checkout...
              </p>
            </div>
          ) : sessionError ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 grid place-items-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-semibold text-rose-600">{sessionError}</p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : paymentSuccess ? (
            /* Payment Success Screen */
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="font-extrabold text-xl text-[var(--color-espresso)]">
                  Payment Authorized &amp; Funded!
                </h3>
                <div className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Escrow Status: Held in Platform Escrow
                </div>
              </div>

              <p className="text-xs text-[var(--color-secondary-text)] max-w-md mx-auto leading-relaxed">
                Your payment of{" "}
                <strong className="text-[var(--color-espresso)] font-bold">
                  ₹{session?.breakdown?.totalAmount.toLocaleString("en-IN")}
                </strong>{" "}
                is safely secured in platform escrow. The rental fee will be released to Host{" "}
                <strong>{session?.owner?.name}</strong> upon item return, and your{" "}
                <strong>
                  ₹{session?.breakdown?.securityDeposit.toLocaleString("en-IN")}
                </strong>{" "}
                deposit will be automatically refunded.
              </p>

              <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-left text-xs space-y-1.5 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted-grey)]">Transaction ID:</span>
                  <span className="font-mono font-bold text-[var(--color-espresso)]">
                    {paymentResult?.transactionId || "TXN_SUCCESS"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted-grey)]">Security Deposit:</span>
                  <span className="font-semibold text-emerald-600">
                    ₹{session?.breakdown?.securityDeposit.toLocaleString("en-IN")} (Held in Escrow)
                  </span>
                </div>
                <div className="flex justify-between border-t border-[var(--color-border)] pt-1.5">
                  <span className="font-bold text-[var(--color-espresso)]">Total Paid:</span>
                  <span className="font-extrabold text-indigo-600">
                    ₹{session?.breakdown?.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Button variant="primary" size="md" onClick={onClose}>
                  Done &amp; View Rental
                </Button>
              </div>
            </div>
          ) : (
            /* Checkout Flow */
            <form onSubmit={handlePayNow} className="space-y-5">
              {/* Item & Pricing Overview Box */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {session?.listing?.image ? (
                    <img
                      src={session.listing.image}
                      alt={session.listing.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[var(--color-border)]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 grid place-items-center shrink-0">
                      <Receipt size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-[var(--color-espresso)] truncate">
                      {session?.listing?.title}
                    </h4>
                    <div className="text-xs text-[var(--color-muted-grey)] flex items-center gap-1.5 mt-0.5">
                      <CalendarDays size={13} className="text-indigo-600" />
                      <span>
                        {new Date(session?.duration?.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        &rarr;{" "}
                        {new Date(session?.duration?.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        ({session?.duration?.days} days)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block">
                    Total Amount
                  </span>
                  <span className="font-extrabold text-lg text-indigo-600 dark:text-indigo-400">
                    ₹{session?.breakdown?.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Methods Selector Tabs */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("card")}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      activeTab === "card"
                        ? "border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-muted-grey)]"
                    }`}
                  >
                    <CreditCard size={18} />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("upi")}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      activeTab === "upi"
                        ? "border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-muted-grey)]"
                    }`}
                  >
                    <Smartphone size={18} />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("netbanking")}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      activeTab === "netbanking"
                        ? "border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-muted-grey)]"
                    }`}
                  >
                    <Building size={18} />
                    <span>NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Inputs */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
                {activeTab === "card" && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--color-espresso)]">
                        Credit / Debit Card
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Instant Verification
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono font-bold text-[var(--color-espresso)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                      />
                    </div>
                  </>
                )}

                {activeTab === "upi" && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--color-espresso)]">
                        UPI VPA Address
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Instant Authorization
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block mb-1">
                        Enter UPI ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@oksbi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap text-[11px] text-[var(--color-muted-grey)]">
                      <span>Popular:</span>
                      <button
                        type="button"
                        onClick={() => setUpiId("success@okaxis")}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        success@okaxis
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiId("renter@paytm")}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        renter@paytm
                      </button>
                    </div>
                  </>
                )}

                {activeTab === "netbanking" && (
                  <>
                    <span className="text-xs font-bold text-[var(--color-espresso)] block mb-1">
                      Select Your Bank
                    </span>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-espresso)]"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    </select>
                  </>
                )}
              </div>

              {/* Itemized Escrow Breakdown */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs space-y-2">
                <div className="flex justify-between text-[var(--color-secondary-text)]">
                  <span>
                    Rental Charge ({session?.duration?.days} day{session?.duration?.days !== 1 ? "s" : ""})
                  </span>
                  <span className="font-semibold text-[var(--color-espresso)]">
                    ₹{session?.breakdown?.baseRent.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-[var(--color-secondary-text)]">
                  <span className="flex items-center gap-1.5">
                    <span>Security Deposit</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Refundable on return
                    </span>
                  </span>
                  <span className="font-bold text-emerald-600">
                    ₹{session?.breakdown?.securityDeposit.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-[var(--color-secondary-text)]">
                  <span>Escrow &amp; Platform Protection (5%)</span>
                  <span className="font-semibold text-[var(--color-espresso)]">
                    ₹{session?.breakdown?.serviceFee.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)] flex justify-between font-extrabold text-sm text-[var(--color-espresso)]">
                  <span>Total Amount Due</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    ₹{session?.breakdown?.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Trust Badges */}
              <div className="flex items-center justify-between text-[10px] text-[var(--color-muted-grey)] font-medium px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>Held in Platform Escrow</span>
                </span>
                <span className="flex items-center gap-1">
                  <Lock size={12} className="text-indigo-600" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Deposit Auto-Refunded</span>
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={processing}
                >
                  Pay ₹{session?.breakdown?.totalAmount.toLocaleString("en-IN")} &amp; Secure Escrow
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
