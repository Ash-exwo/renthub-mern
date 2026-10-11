const mongoose = require("mongoose");
const Booking = require("../models/BookingModel");
const Listing = require("../models/ListingModel");

/**
 * Normalizes a date string/object to midnight (00:00:00.000)
 */
function normalizeDateToMidnight(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * POST /api/bookings
 * Renter submits a new booking request for an available rental listing.
 */
exports.createBooking = async (req, res) => {
  try {
    const renterId = req.user._id;
    const { listingId, startDate, endDate, notes } = req.body;

    // 1. Basic validation
    if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "A valid listing ID is required." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Both start and end dates are required." });
    }

    const start = normalizeDateToMidnight(startDate);
    const end = normalizeDateToMidnight(endDate);
    const today = normalizeDateToMidnight(new Date());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format provided." });
    }

    if (start < today) {
      return res.status(400).json({ message: "Rental start date cannot be in the past." });
    }

    if (end <= start) {
      return res.status(400).json({ message: "Rental end date must be after the start date." });
    }

    // 2. Fetch Listing and verify availability
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (listing.availability === "inactive") {
      return res.status(400).json({ message: "This listing is currently inactive and cannot be rented." });
    }

    // 3. Prevent owner from booking their own item
    if (listing.owner.toString() === renterId.toString()) {
      return res.status(400).json({ message: "You cannot book your own listing." });
    }

    // 4. Overlap Prevention: Check conflicting pending or confirmed bookings
    // Overlap condition: existing.startDate < requested.endDate && existing.endDate > requested.startDate
    const conflictingBooking = await Booking.findOne({
      listing: listingId,
      status: { $in: ["pending", "confirmed"] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        message:
          "The selected dates conflict with an existing booking for this item. Please choose different dates.",
        conflictingBooking: {
          startDate: conflictingBooking.startDate,
          endDate: conflictingBooking.endDate,
          status: conflictingBooking.status,
        },
      });
    }

    // 5. Server-side price calculation (Never trust client prices)
    const diffTime = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const dailyRate = Number(listing.rentalPricePerDay || 0);
    const basePrice = dailyRate * days;
    const deposit = Number(listing.deposit || 0);
    const serviceFee = Math.round(basePrice * 0.05); // Standard 5% platform service fee
    const totalPrice = basePrice + deposit + serviceFee;

    // 6. Create booking record
    const booking = new Booking({
      renter: renterId,
      listing: listing._id,
      owner: listing.owner,
      startDate: start,
      endDate: end,
      days,
      dailyRate,
      basePrice,
      deposit,
      serviceFee,
      totalPrice,
      status: "pending",
      notes: notes ? String(notes).trim().slice(0, 500) : "",
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("listing", "title images location rentalPricePerDay category")
      .populate("owner", "name email");

    return res.status(201).json({
      message: "Booking request submitted successfully! Awaiting owner confirmation.",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({
      message: "An error occurred while creating your booking request.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/my-rentals
 * Renter views all rentals they have requested or booked.
 */
exports.getMyRentals = async (req, res) => {
  try {
    const renterId = req.user._id;
    const filter = { renter: renterId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate("listing", "title images location rentalPricePerDay category availability")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("getMyRentals error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching your rental bookings.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/owner-requests
 * Owner views all incoming booking requests for listings they own.
 */
exports.getOwnerRequests = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const filter = { owner: ownerId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate("listing", "title images location rentalPricePerDay category availability")
      .populate("renter", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("getOwnerRequests error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching owner booking requests.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/:id
 * Retrieve a single booking details (accessible by renter or owner).
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const booking = await Booking.findById(id)
      .populate("listing", "title images location rentalPricePerDay deposit category owner")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Authorization: User must be either the renter or the owner
    const isRenter = booking.renter._id.toString() === userId;
    const isOwner = booking.owner._id.toString() === userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: "You are not authorized to view this booking." });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching booking details.",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/bookings/:id/status
 * Updates status of a booking enforcing strict role permissions and state machine.
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: nextStatus, reason } = req.body;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const validStatuses = ["confirmed", "rejected", "cancelled", "completed"];
    if (!nextStatus || !validStatuses.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid status. Permitted statuses are: ${validStatuses.join(", ")}`,
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const isOwner = booking.owner.toString() === userId;
    const isRenter = booking.renter.toString() === userId;

    if (!isOwner && !isRenter) {
      return res.status(403).json({ message: "You are not authorized to update this booking." });
    }

    const currentStatus = booking.status;

    // Terminal statuses cannot be modified
    if (["rejected", "cancelled", "completed"].includes(currentStatus)) {
      return res.status(400).json({
        message: `Cannot update booking that is already ${currentStatus}.`,
      });
    }

    // Role-based State Machine validation
    if (isOwner) {
      // Owner can:
      // pending -> confirmed | rejected
      // confirmed -> completed
      if (currentStatus === "pending") {
        if (!["confirmed", "rejected"].includes(nextStatus)) {
          return res.status(400).json({
            message: `As owner, you can only accept (confirm) or reject a pending request.`,
          });
        }
      } else if (currentStatus === "confirmed") {
        if (nextStatus !== "completed") {
          return res.status(400).json({
            message: `As owner, you can only mark a confirmed booking as completed.`,
          });
        }
      }

      // If owner is confirming, double-check for concurrent confirmed overlap!
      if (nextStatus === "confirmed") {
        const overlapConfirmed = await Booking.findOne({
          _id: { $ne: booking._id },
          listing: booking.listing,
          status: "confirmed",
          startDate: { $lt: booking.endDate },
          endDate: { $gt: booking.startDate },
        });

        if (overlapConfirmed) {
          return res.status(409).json({
            message:
              "Cannot confirm booking: another booking is already confirmed for overlapping dates.",
          });
        }
      }

      if (nextStatus === "rejected" && reason) {
        booking.rejectionReason = String(reason).trim().slice(0, 300);
      }
    } else if (isRenter) {
      // Renter can only cancel their booking (from pending or confirmed)
      if (nextStatus !== "cancelled") {
        return res.status(400).json({
          message: `As renter, you can only cancel your booking request.`,
        });
      }

      if (reason) {
        booking.cancellationReason = String(reason).trim().slice(0, 300);
      }
    }

    booking.status = nextStatus;
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate("listing", "title images location rentalPricePerDay category")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone");

    return res.status(200).json({
      message: `Booking successfully marked as ${nextStatus}.`,
      booking: updated,
    });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    return res.status(500).json({
      message: "An error occurred while updating booking status.",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/listing/:listingId/booked-dates
 * Public/Renter helper: Returns all booked date intervals for a listing
 * so calendar UI can visually disable unavailable dates.
 */
exports.getBookedDatesForListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const today = normalizeDateToMidnight(new Date());

    const activeBookings = await Booking.find({
      listing: listingId,
      status: { $in: ["pending", "confirmed"] },
      endDate: { $gte: today },
    }).select("startDate endDate status");

    const bookedRanges = activeBookings.map((b) => ({
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
    }));

    return res.status(200).json({
      listingId,
      bookedRanges,
    });
  } catch (error) {
    console.error("getBookedDatesForListing error:", error);
    return res.status(500).json({
      message: "An error occurred while fetching booked dates for this listing.",
      error: error.message,
    });
  }
};
