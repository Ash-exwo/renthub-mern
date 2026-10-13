import React, { useState } from "react";
import {
  ShieldCheck,
  MessageSquare,
  CreditCard,
  Camera,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Modal, Button } from "./ui";

export default function ChatSafetyModal({ isOpen, onClose, onAccept }) {
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    if (!agreed) return;
    try {
      localStorage.setItem("renthub_chat_safety_accepted", "true");
    } catch {}
    if (onAccept) onAccept();
    if (onClose) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Safe Rental & Chat Guidelines"
      maxWidth="34rem"
      showClose={true}
    >
      <div className="p-6 space-y-5">
        {/* Header Banner */}
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-md">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--color-espresso)]">
              RentHub Safe Community Pledge
            </h4>
            <p className="text-xs text-[var(--color-muted-grey)] mt-0.5 leading-relaxed">
              To keep our community safe and protect your equipment and security deposit, please review these key guidelines before starting your conversation.
            </p>
          </div>
        </div>

        {/* Safety Tips List (OLX / Turo style) */}
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)]">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid place-items-center shrink-0">
              <MessageSquare size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-espresso)]">
                1. Keep All Communication on RentHub
              </div>
              <p className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 leading-relaxed">
                Chatting inside the platform ensures full documented proof of handover times and agreement terms if any dispute arises.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)]">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-espresso)]">
                2. Never Pay Direct Cash or Off-Platform UPI
              </div>
              <p className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 leading-relaxed">
                RentHub Escrow safeguards your funds until handover. Paying outside RentHub voids escrow protection, damage claims, and deposit refunds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)]">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0">
              <Camera size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-espresso)]">
                3. Inspect & Test Gear at Handover
              </div>
              <p className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 leading-relaxed">
                Both host and renter should test equipment functionality together and take quick photos of pre-existing condition before handoff.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
              <Lock size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-espresso)]">
                4. Protect Your Personal Credentials
              </div>
              <p className="text-[11px] text-[var(--color-muted-grey)] mt-0.5 leading-relaxed">
                Never share bank PINs, OTPs, or passwords. RentHub support will never ask for your confidential banking credentials.
              </p>
            </div>
          </div>
        </div>

        {/* User Agreement Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer select-none hover:bg-[var(--color-surface-hover)] transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-[var(--color-brand-primary)] border-gray-300 focus:ring-[var(--color-brand-primary)] cursor-pointer"
          />
          <span className="text-xs text-[var(--color-espresso)] font-medium leading-relaxed">
            I have read and agree to follow RentHub's Safe Chat & Handover Guidelines.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={ArrowRight}
            disabled={!agreed}
            onClick={handleConfirm}
          >
            Continue to Chat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
