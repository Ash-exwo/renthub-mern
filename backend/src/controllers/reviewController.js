const mongoose = require("mongoose");
const Review = require("../models/ReviewModel");
const Booking = require("../models/BookingModel");
const Listing = require("../models/ListingModel");
const { createNotification } = require("./notificationController");

/**
 * Recalculates averageRating and totalReviews on a Listing document
 */
async function recalculateListingRating(listingId) {
  try {
    const stats = await Review.aggregate([
      { $match: { listing: new mongoose.Types.ObjectId(listingId) } },
      {
        $group: {
          _id: "$listing",
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Listing.findByIdAndUpdate(listingId, {
        averageRating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].total,
      });
    } else {
      await Listing.findByIdAndUpdate(listingId, {
        averageRating: 0,
        totalReviews: 0,
      });
    }
  } catch (err) {
    console.error("Error recalculating listing rating:", err);
  }
}

/**
 * POST /api/reviews
 * Verified renter submits a 1-5 star review for a completed booking
 */
exports.createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "A valid booking ID is required." });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 5) {
      return res.status(400).json({ message: "Review comment must be at least 5 characters long." });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({ message: "Review comment cannot exceed 1000 characters." });
    }

    const booking = await Booking.findById(bookingId).populate("listing", "title");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only the renter of this booking can review
    if (booking.renter.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the renter who booked this item can submit a review." });
    }

    // Strict verification: Booking must be in completed status
    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "Only completed rentals can be reviewed. You can review once the rental concludes.",
      });
    }

    // Enforce 1 review per booking
    const existing = await Review.findOne({ booking: booking._id });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted a review for this booking." });
    }

    const review = await Review.create({
      reviewer: userId,
      listing: booking.listing._id || booking.listing,
      booking: booking._id,
      rating: Math.round(numRating * 10) / 10,
      comment: comment.trim(),
    });

    // Update listing aggregates in background
    await recalculateListingRating(booking.listing._id || booking.listing);

    // Notify host
    createNotification({
      recipient: booking.owner,
      sender: userId,
      type: "review_received",
      title: "New Verified Review! ⭐",
      message: `${req.user.name || "A renter"} left a ${numRating}-star review for "${booking.listing?.title || "your listing"}".`,
      booking: booking._id,
      listing: booking.listing._id || booking.listing,
      link: `/listings/${booking.listing._id || booking.listing}`,
    }).catch(() => {});

    const populated = await Review.findById(review._id).populate("reviewer", "name avatar");

    return res.status(201).json({
      message: "Review submitted successfully! Thank you for your feedback.",
      review: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already submitted a review for this booking." });
    }
    console.error("createReview error:", error);
    return res.status(500).json({
      message: "An error occurred while submitting your review.",
      error: error.message,
    });
  }
};

/**
 * GET /api/reviews/listing/:listingId
 * Public endpoint to fetch all reviews and rating breakdown for a listing
 */
exports.getListingReviews = async (req, res) => {
  try {
    const { listingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const reviews = await Review.find({ listing: listingId })
      .populate("reviewer", "name avatar createdAt")
      .sort({ createdAt: -1 });

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      if (breakdown[rounded] !== undefined) {
        breakdown[rounded] += 1;
      }
      sum += r.rating;
    });

    const averageRating = reviews.length > 0 ? Math.round((sum / reviews.length) * 10) / 10 : 0;

    return res.status(200).json({
      totalReviews: reviews.length,
      averageRating,
      breakdown,
      reviews,
    });
  } catch (error) {
    console.error("getListingReviews error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching listing reviews.",
      error: error.message,
    });
  }
};

/**
 * GET /api/reviews/booking/:bookingId
 * Checks if the authenticated user has reviewed a specific booking
 */
exports.getBookingReview = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const review = await Review.findOne({ booking: bookingId }).populate("reviewer", "name avatar");

    return res.status(200).json({
      hasReviewed: Boolean(review),
      review: review || null,
    });
  } catch (error) {
    console.error("getBookingReview error:", error);
    return res.status(500).json({
      message: "An error occurred while checking booking review status.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/reviews/:id
 * Delete a review (by original author or admin)
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review ID format." });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (!isAdmin && review.reviewer.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this review." });
    }

    const listingId = review.listing;
    await Review.findByIdAndDelete(id);
    await recalculateListingRating(listingId);

    return res.status(200).json({ message: "Review deleted successfully." });
  } catch (error) {
    console.error("deleteReview error:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the review.",
      error: error.message,
    });
  }
};
