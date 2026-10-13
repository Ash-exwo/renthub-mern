import React, { useState } from "react";
import {
  Flag,
  AlertTriangle,
  CreditCard,
  Camera,
  ShieldAlert,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Modal, Button } from "./ui";
import api from "../utils/api";

const CATEGORIES = [
  {
    id: "scam_off_platform",
    label: "Off-Platform Payment Demand",
    desc: "Host asked for direct cash, UPI, or deposit outside RentHub Escrow",
    icon: CreditCard,
    color: "text-rose-600 bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "misleading",
    label: "Misleading Photos or Description",
    desc: "Item condition, model, or specifications do not match the photos",
    icon: Camera,
    color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "safety_hazard",
    label: "Defective or Safety Hazard",
    desc: "Gear is broken, hazardous, or missing critical safety components",
    icon: AlertTriangle,
    color: "text-orange-600 bg-orange-500/10 border-orange-500/20",
  },
  {
    id: "prohibited",
    label: "Prohibited or Stolen Gear",
    desc: "Suspected stolen equipment, illegal items, or restricted goods",
    icon: ShieldAlert,
    color: "text-purple-600 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "abusive_conduct",
    label: "Abusive Conduct or Harassment",
    desc: "Unprofessional, offensive, or threatening messages from the owner",
    icon: MessageSquare,
    color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "other",
    label: "Other Policy Violation",
    desc: "Any other behavior violating RentHub Community Guidelines",
    icon: HelpCircle,
    color: "text-slate-600 bg-slate-500/10 border-slate-500/20",
  },
];

export default function ReportListingModal({
  isOpen,
  onClose,
  listingId,
  listingTitle = "Item",
  onReportSubmitted,
}) {
  const [selectedCategory, setSelectedCategory] = useState("scam_off_platform");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Please explain the issue with at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/reports", {
        targetListingId: listingId,
        category: selectedCategory,
        reason: reason.trim(),
      });

      if (res.data?.success) {
        setSuccess(true);
        if (onReportSubmitted) onReportSubmitted(res.data.report);
        setTimeout(() => {
          setSuccess(false);
          setReason("");
          onClose();
        }, 2200);
      }
    } catch (err) {
      console.error("Report submission failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit report. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report Rental Item"
      maxWidth="34rem"
      showClose={!submitting}
    >
      <div className="p-6">
        {success ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-extrabold text-lg text-[var(--color-espresso)]">
              Report Submitted
            </h4>
            <p className="text-xs text-[var(--color-muted-grey)] mt-1.5 max-w-sm leading-relaxed">
              Thank you for protecting our community. Our Trust &amp; Safety team will investigate
              "{listingTitle}" and take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Header Hint */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)]">
              <Flag size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--color-muted-grey)] leading-relaxed">
                Reporting: <strong className="text-[var(--color-espresso)] font-bold">{listingTitle}</strong>.
                Reports are confidential and reviewed by RentHub safety officers within 2 hours.
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-espresso)] mb-2 uppercase tracking-wider">
                Select Violation Category
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <label
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[var(--color-surface)] border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)] shadow-xs"
                          : "bg-[var(--color-surface-subtle)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportCategory"
                        value={cat.id}
                        checked={isSelected}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="mt-1 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="shrink-0 text-[var(--color-espresso)]" />
                          <span className="font-bold text-xs text-[var(--color-espresso)]">
                            {cat.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 leading-snug">
                          {cat.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[var(--color-espresso)] uppercase tracking-wider">
                  Detailed Explanation
                </label>
                <span className="text-[10px] text-[var(--color-muted-grey)]">
                  {reason.length}/1000 (min 10 chars)
                </span>
              </div>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe what happened, what the host stated, or any safety evidence..."
                maxLength={1000}
                className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={submitting}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Flag}
                disabled={submitting || reason.trim().length < 10}
                className="bg-rose-600 hover:bg-rose-700 text-white! border-rose-600!"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
