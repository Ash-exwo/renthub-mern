import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  ShieldCheck,
  CalendarDays,
  User,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import api from "../utils/api";
import { Button } from "./ui";

export default function PaymentReceiptModal({ bookingId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && bookingId) {
      setLoading(true);
      setError("");

      api
        .get(`/payments/booking/${bookingId}`)
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          console.error("Failed to load receipt:", err);
          setError(
            err.response?.data?.message || "Failed to load payment receipt."
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const payment = data?.payment;
  const booking = data?.booking;
  const isRefunded = payment?.status === "refunded";
  const isReleased = payment?.escrowStatus === "released_to_host";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)] shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid place-items-center">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[var(--color-espresso)]">
                Official Payment Receipt
              </h3>
              <p className="text-xs text-[var(--color-muted-grey)]">
                Platform Escrow &amp; Security Deposit Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)] transition-colors"
              title="Print Receipt"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-[var(--color-muted-grey)]">
                Loading official receipt...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-600 text-sm font-semibold">
              {error}
            </div>
          ) : !payment ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--color-espresso)]">
                No payment recorded yet for this booking.
              </p>
              <p className="text-xs text-[var(--color-muted-grey)]">
                Once the renter completes payment, verified escrow records will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Receipt Header Badge */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block">
                    Transaction ID
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-[var(--color-espresso)]">
                    {payment.transactionId}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                      isRefunded
                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                        : isReleased
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20"
                    }`}
                  >
                    {isRefunded
                      ? "Refund Processed"
                      : isReleased
                      ? "Escrow Payout Released"
                      : "Paid · Held in Escrow"}
                  </span>
                </div>
              </div>

              {/* Parties & Dates Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-[var(--color-border)] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block">
                    Renter (Payer)
                  </span>
                  <div className="font-bold text-[var(--color-espresso)]">
                    {booking?.renter?.name || "Renter"}
                  </div>
                  <div className="text-[var(--color-muted-grey)] truncate">
                    {booking?.renter?.email}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--color-border)] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block">
                    Rental Host (Recipient)
                  </span>
                  <div className="font-bold text-[var(--color-espresso)]">
                    {booking?.owner?.name || "Host"}
                  </div>
                  <div className="text-[var(--color-muted-grey)] truncate">
                    {booking?.owner?.email}
                  </div>
                </div>
              </div>

              {/* Item & Period */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block">
                    Rented Asset
                  </span>
                  <div className="font-bold text-sm text-[var(--color-espresso)]">
                    {booking?.listing?.title}
                  </div>
                  <div className="text-[var(--color-muted-grey)] mt-0.5">
                    {booking?.days} {booking?.days === 1 ? "day" : "days"} (
                    {new Date(booking?.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    &rarr;{" "}
                    {new Date(booking?.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                    )
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] block">
                    Payment Method
                  </span>
                  <span className="font-bold capitalize text-[var(--color-espresso)]">
                    {payment.paymentMethod}
                  </span>
                  {payment.paymentDetails?.cardLast4 && (
                    <span className="text-[11px] text-[var(--color-muted-grey)] block">
                      •••• {payment.paymentDetails.cardLast4}
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden text-xs">
                <div className="bg-[var(--color-surface-secondary)]/50 p-3 font-bold border-b border-[var(--color-border)] flex justify-between">
                  <span>Fee Component</span>
                  <span>Amount (INR)</span>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-[var(--color-secondary-text)]">
                    <span>
                      Rental Charges ({booking?.days} days × ₹{booking?.dailyRate}/day)
                    </span>
                    <span className="font-semibold text-[var(--color-espresso)]">
                      ₹{payment.breakdown.baseRent.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-[var(--color-secondary-text)]">
                    <div className="flex items-center gap-1.5">
                      <span>Refundable Security Deposit</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {payment.depositStatus === "refunded" ? "Refunded" : "Held in Escrow"}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600">
                      ₹{payment.breakdown.deposit.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-[var(--color-secondary-text)]">
                    <span>Platform Protection &amp; Escrow Fee (5%)</span>
                    <span className="font-semibold text-[var(--color-espresso)]">
                      ₹{payment.breakdown.serviceFee.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)] flex justify-between font-extrabold text-sm text-[var(--color-espresso)]">
                    <span>Total Paid</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ₹{payment.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund Notice (if refunded) */}
              {isRefunded && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-800 dark:text-purple-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <RotateCcw size={14} />
                    <span>Refund Successfully Issued</span>
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    Refund ID: <span className="font-mono">{payment.refundDetails?.refundId}</span>
                    <br />
                    Amount Refunded:{" "}
                    <strong>₹{payment.refundDetails?.refundAmount?.toLocaleString("en-IN")}</strong>
                    {payment.refundDetails?.reason && ` · Reason: "${payment.refundDetails.reason}"`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
