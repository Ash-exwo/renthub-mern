const mongoose = require("mongoose");
const Listing = require("../models/ListingModel");
const Category = require("../models/CategoryModel");

// Step 5 & Part 2: Authenticated user creates a new listing linked to a Category ObjectId
// POST /api/listings
exports.createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      rentalPricePerDay,
      location,
      coordinates,
      images,
      deposit,
      amenities,
      rules,
      availability,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      rentalPricePerDay === undefined ||
      !location
    ) {
      return res.status(400).json({
        message: "Please fill in all required listing fields.",
      });
    }

    // 1. Validate Category ObjectId format
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        message: "Invalid category ID format.",
      });
    }

    // 2. Validate Category exists in DB
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        message: "Selected category does not exist.",
      });
    }

    // 3. Validate Category is currently Active
    if (!categoryDoc.isActive) {
      return res.status(400).json({
        message:
          "Selected category is currently inactive and cannot be used for new listings.",
      });
    }

    // 4. Create Listing linked to Category ObjectId and authenticated User (owner)
    const listing = await Listing.create({
      title: title.trim(),
      description: description.trim(),
      category: categoryDoc._id,
      rentalPricePerDay: Number(rentalPricePerDay),
      location: location.trim(),
      coordinates:
        coordinates && typeof coordinates === "object"
          ? {
              lat: typeof coordinates.lat === "number" ? coordinates.lat : null,
              lng: typeof coordinates.lng === "number" ? coordinates.lng : null,
            }
          : undefined,
      images: Array.isArray(images) ? images : [],
      deposit: Number(deposit || 0),
      amenities: Array.isArray(amenities)
        ? amenities
        : typeof amenities === "string"
        ? amenities.split(",").map((a) => a.trim()).filter(Boolean)
        : [],
      rules: rules ? String(rules).trim() : "",
      availability: availability || "available",
      isActive: true,
      owner: req.user._id,
    });

    const populatedListing = await Listing.findById(listing._id)
      .populate("category", "name icon description")
      .populate("owner", "name email");

    return res.status(201).json({
      message: "Listing created successfully.",
      listing: populatedListing,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(" ");

      return res.status(400).json({ message });
    }

    console.error("Create listing error:", error);

    return res.status(500).json({
      message: "Unable to create listing. Please try again.",
    });
  }
};

// Part 2: Owner retrieves their own listings with populated category
// GET /api/listings/my & GET /api/listings/my-listings
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate("category", "name icon description")
      .populate("owner", "name email");

    return res.status(200).json({
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Get my listings error:", error);

    return res.status(500).json({
      message: "Unable to load your listings. Please try again.",
    });
  }
};

// Part 3, Step 17: Get single listing details
// GET /api/listings/:id
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid listing ID format.",
      });
    }

    const listing = await Listing.findById(id)
      .populate("category", "name icon description isActive")
      .populate("owner", "name email phone avatar createdAt");

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found.",
      });
    }

    return res.status(200).json({
      listing,
    });
  } catch (error) {
    console.error("Get listing by ID error:", error);

    return res.status(500).json({
      message: "Unable to load listing details. Please try again.",
    });
  }
};

// Part 3, Step 18: Owner updates their own listing with strict ownership check
// PUT /api/listings/:id
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      rentalPricePerDay,
      location,
      coordinates,
      images,
      availability,
      deposit,
      amenities,
      rules,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid listing ID format.",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found.",
      });
    }

    // Strict Ownership Check: user can only edit their own listing
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this listing.",
      });
    }

    // If updating category, validate it
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          message: "Invalid category ID format.",
        });
      }

      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({
          message: "Selected category does not exist.",
        });
      }

      if (!categoryDoc.isActive) {
        return res.status(400).json({
          message:
            "Selected category is currently inactive and cannot be selected.",
        });
      }

      listing.category = categoryDoc._id;
    }

    if (title !== undefined) listing.title = title.trim();
    if (description !== undefined) listing.description = description.trim();
    if (rentalPricePerDay !== undefined) {
      listing.rentalPricePerDay = Number(rentalPricePerDay);
    }
    if (location !== undefined) listing.location = location.trim();
    if (coordinates !== undefined && typeof coordinates === "object") {
      listing.coordinates = {
        lat: typeof coordinates.lat === "number" ? coordinates.lat : null,
        lng: typeof coordinates.lng === "number" ? coordinates.lng : null,
      };
    }
    if (images !== undefined && Array.isArray(images)) listing.images = images;
    if (deposit !== undefined) listing.deposit = Number(deposit || 0);
    if (amenities !== undefined) {
      listing.amenities = Array.isArray(amenities)
        ? amenities
        : typeof amenities === "string"
        ? amenities.split(",").map((a) => a.trim()).filter(Boolean)
        : [];
    }
    if (rules !== undefined) listing.rules = String(rules).trim();
    if (availability !== undefined) {
      listing.availability = availability;
      listing.isActive = availability === "available";
    }

    await listing.save();

    const updatedListing = await Listing.findById(id)
      .populate("category", "name icon description")
      .populate("owner", "name email");

    return res.status(200).json({
      message: "Listing updated successfully.",
      listing: updatedListing,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(" ");

      return res.status(400).json({ message });
    }

    console.error("Update listing error:", error);

    return res.status(500).json({
      message: "Unable to update listing. Please try again.",
    });
  }
};

// Part 3, Step 19: Owner soft deactivates/activates listing (does not delete)
// PATCH /api/listings/:id/status
exports.updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, availability } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid listing ID format.",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found.",
      });
    }

    // Strict Ownership Check
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to modify this listing status.",
      });
    }

    if (isActive !== undefined) {
      listing.isActive = Boolean(isActive);
      listing.availability = listing.isActive ? "available" : "unavailable";
    } else if (availability !== undefined) {
      listing.availability = availability;
      listing.isActive = availability === "available";
    } else {
      listing.isActive = !listing.isActive;
      listing.availability = listing.isActive ? "available" : "unavailable";
    }

    await listing.save();

    const statusMessage = listing.isActive
      ? "Listing activated and visible for public rentals."
      : "Listing deactivated and hidden from public browsing.";

    return res.status(200).json({
      message: statusMessage,
      listing,
    });
  } catch (error) {
    console.error("Update listing status error:", error);

    return res.status(500).json({
      message: "Unable to update listing status. Please try again.",
    });
  }
};

// Part 3, Steps 20 & 21: Get Public Listings (isActive: true) with optional category filter
// GET /api/listings & GET /api/listings?category=abc123
exports.getAllListings = async (req, res) => {
  try {
    const { category } = req.query;

    const query = { isActive: true };

    // Option A: Exclude logged-in user's own listings in Renter / Explore mode
    if (req.user && req.user._id) {
      query.owner = { $ne: req.user._id };
    }

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          message: "Invalid category ID filter.",
        });
      }
      query.category = category;
    }

    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .populate("category", "name icon description")
      .populate("owner", "name email");

    return res.status(200).json({
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Get all listings error:", error);

    return res.status(500).json({
      message: "Unable to load listings. Please try again.",
    });
  }
};

// Owner deletes listing
// DELETE /api/listings/:id
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid listing ID format.",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found.",
      });
    }

    // Ownership check
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this listing.",
      });
    }

    await Listing.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    console.error("Delete listing error:", error);

    return res.status(500).json({
      message: "Unable to delete listing. Please try again.",
    });
  }
};

// Admin: Get all listings (active and inactive) from MongoDB
// GET /api/listings/admin/all
exports.getAdminListings = async (req, res) => {
  try {
    const listings = await Listing.find({})
      .sort({ createdAt: -1 })
      .populate("category", "name icon description isActive")
      .populate("owner", "name email phone");

    return res.status(200).json({
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Get admin listings error:", error);
    return res.status(500).json({
      message: "Unable to load listings for admin.",
    });
  }
};

// Admin: Toggle listing status or isActive in MongoDB
// PATCH /api/listings/admin/:id/status
exports.adminUpdateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, availability } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (isActive !== undefined) {
      listing.isActive = Boolean(isActive);
    }
    if (availability !== undefined) {
      listing.availability = availability;
    }

    await listing.save();

    const updated = await Listing.findById(id)
      .populate("category", "name icon description isActive")
      .populate("owner", "name email phone");

    return res.status(200).json({
      message: "Listing status updated successfully in database.",
      listing: updated,
    });
  } catch (error) {
    console.error("Admin update listing error:", error);
    return res.status(500).json({ message: "Failed to update listing." });
  }
};

// Admin: Delete any listing from MongoDB
// DELETE /api/listings/admin/:id
exports.adminDeleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const listing = await Listing.findByIdAndDelete(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    return res.status(200).json({ message: "Listing permanently deleted from database." });
  } catch (error) {
    console.error("Admin delete listing error:", error);
    return res.status(500).json({ message: "Failed to delete listing." });
  }
};