import React, { useState } from "react";
import { Star, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { Modal, Button } from "./ui";
import api from "../utils/api";

const RATING_LABELS = {
  1: "Poor experience",
  2: "Fair, had some issues",
  3: "Good, met basic expectations",
  4: "Very good, highly recommended",
  5: "Exceptional! Exceeded expectations",
};

export default function ReviewModal({
  isOpen,
  onClose,
  booking,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const listingTitle = booking.listing?.title || "Rental Item";
  const displayRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError("Please write a review comment (minimum 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/reviews", {
        bookingId: booking._id,
        rating,
        comment: comment.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        if (onReviewSubmitted) onReviewSubmitted(res.data.review);
        onClose();
        setSuccess(false);
        setComment("");
        setRating(5);
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) {
          setError("");
          onClose();
        }
      }}
      title="Rate & Review Your Rental"
    >
      {success ? (
        <div className="py-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-xl font-extrabold text-[var(--color-espresso)] mb-1">
            Review Submitted!
          </h3>
          <p className="text-sm text-[var(--color-muted-grey)] max-w-xs">
            Thank you for sharing your verified experience with the RentHub community.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Item Context Banner */}
          <div className="p-3.5 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center gap-3">
            {booking.listing?.images?.[0] && (
              <img
                src={booking.listing.images[0]}
                alt={listingTitle}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted-grey)]">
                Verified Completed Rental
              </span>
              <h4 className="font-bold text-sm text-[var(--color-espresso)] truncate">
                {listingTitle}
              </h4>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Star Rating Picker */}
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <span className="text-xs font-bold text-[var(--color-muted-grey)] uppercase tracking-wider">
              Overall Experience
            </span>

            <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    size={32}
                    className={`transition-colors duration-150 ${
                      star <= displayRating
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]"
                        : "fill-transparent text-gray-300 dark:text-gray-700"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-[var(--color-brand-primary)] h-5 flex items-center gap-1">
              <Sparkles size={13} />
              <span>{RATING_LABELS[displayRating]}</span>
            </div>
          </div>

          {/* Review Feedback Textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="review-comment" className="font-bold text-[var(--color-espresso)]">
                Your Feedback
              </label>
              <span className="text-[11px] text-[var(--color-muted-grey)] font-mono">
                {comment.length}/1000
              </span>
            </div>

            <textarea
              id="review-comment"
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the condition of the item? Was the host responsive and helpful during handover?"
              className="w-full p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-espresso)] placeholder-[var(--color-muted-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all leading-relaxed resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={submitting}
              onClick={() => {
                setError("");
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              icon={Star}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              Submit Review
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
