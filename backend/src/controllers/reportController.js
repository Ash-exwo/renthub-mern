const Report = require("../models/ReportModel");
const Listing = require("../models/ListingModel");
const User = require("../models/UserModel");
const Notification = require("../models/NotificationModel");

/**
 * POST /api/reports
 * Submit a report/flag against a rental listing
 */
exports.createReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetListingId, category, reason } = req.body;

    if (!targetListingId) {
      return res.status(400).json({ message: "Target listing ID is required." });
    }

    if (!category) {
      return res.status(400).json({ message: "Report violation category is required." });
    }

    const validCategories = [
      "misleading",
      "scam_off_platform",
      "safety_hazard",
      "prohibited",
      "abusive_conduct",
      "other",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid violation category selected." });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
      return res.status(400).json({
        message: "Please provide a detailed reason with at least 10 characters.",
      });
    }

    if (reason.trim().length > 1000) {
      return res.status(400).json({
        message: "Report explanation cannot exceed 1000 characters.",
      });
    }

    const listing = await Listing.findById(targetListingId);
    if (!listing) {
      return res.status(404).json({ message: "Target listing not found." });
    }

    // Block owner from reporting their own item
    if (listing.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot report your own listing." });
    }

    // Check if user already submitted an active report for this listing
    const existing = await Report.findOne({
      reporter: userId,
      targetListing: listing._id,
      status: { $in: ["pending", "investigating"] },
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already submitted a report for this listing. Our moderation team is actively reviewing it.",
      });
    }

    // Create Report
    const report = await Report.create({
      reporter: userId,
      targetType: "listing",
      targetListing: listing._id,
      targetUser: listing.owner,
      category,
      reason: reason.trim(),
      status: "pending",
    });

    // Notify Reporter of receipt
    try {
      await Notification.create({
        recipient: userId,
        type: "general",
        title: "Report Received 🛡️",
        message: `Thank you for reporting "${listing.title}". Our Trust & Safety team is reviewing the issue.`,
        listing: listing._id,
      });
    } catch (notifErr) {
      console.error("Warning: Failed to create report confirmation notification:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully to RentHub Trust & Safety.",
      report,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({ message: "Failed to submit report. Please try again." });
  }
};

/**
 * GET /api/reports/admin
 * Retrieve all reports with live status metrics for admin console
 */
exports.getAdminReports = async (req, res) => {
  try {
    const { status, search } = req.query;

    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate("reporter", "name email avatar")
      .populate("targetListing", "title images rentalPricePerDay location isActive availability owner")
      .populate("targetUser", "name email avatar")
      .populate("resolvedBy", "username")
      .sort({ createdAt: -1 });

    // Filter by search query if provided
    let filtered = reports;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = reports.filter((r) => {
        const itemTitle = r.targetListing?.title || "";
        const reporterName = r.reporter?.name || "";
        const ownerName = r.targetUser?.name || "";
        const reasonText = r.reason || "";
        return (
          itemTitle.toLowerCase().includes(q) ||
          reporterName.toLowerCase().includes(q) ||
          ownerName.toLowerCase().includes(q) ||
          reasonText.toLowerCase().includes(q)
        );
      });
    }

    const [total, pending, investigating, resolved, dismissed] = await Promise.all([
      Report.countDocuments({}),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "investigating" }),
      Report.countDocuments({ status: "resolved" }),
      Report.countDocuments({ status: "dismissed" }),
    ]);

    return res.status(200).json({
      success: true,
      reports: filtered,
      counts: {
        total,
        pending,
        investigating,
        resolved,
        dismissed,
      },
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return res.status(500).json({ message: "Failed to fetch reports." });
  }
};

/**
 * PATCH /api/reports/admin/:id/action
 * Resolve or act on a report (e.g. Pause Listing, Dismiss, Add Notes)
 */
exports.actionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken, adminNotes } = req.body;

    const report = await Report.findById(id).populate("targetListing");
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    const nextStatus = status || "resolved";
    const nextAction = actionTaken || "none";

    // If admin requested listing pause, immediately freeze listing in database
    if (nextAction === "listing_paused" && report.targetListing) {
      await Listing.findByIdAndUpdate(report.targetListing._id || report.targetListing, {
        isActive: false,
        availability: "unavailable",
      });

      // Dispatch warning notification to listing owner
      try {
        await Notification.create({
          recipient: report.targetUser,
          type: "general",
          title: "Listing Paused for Safety Review ⚠️",
          message: `Your listing "${report.targetListing.title || "item"}" has been temporarily paused by RentHub Trust & Safety following a community report.`,
          listing: report.targetListing._id || report.targetListing,
        });
      } catch (e) {
        console.error("Warning: Failed to notify owner of listing pause:", e.message);
      }
    }

    report.status = nextStatus;
    report.actionTaken = nextAction;
    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes.trim();
    }
    report.resolvedBy = req.admin?._id || null;
    report.resolvedAt = new Date();
    await report.save();

    // Notify Reporter of report resolution
    try {
      await Notification.create({
        recipient: report.reporter,
        type: "general",
        title: "Report Reviewed ✅",
        message: `Your report regarding "${report.targetListing?.title || "item"}" has been reviewed by our safety team. Status: ${nextStatus}.`,
        listing: report.targetListing?._id || report.targetListing,
      });
    } catch (e) {
      console.error("Warning: Failed to notify reporter of resolution:", e.message);
    }

    const populated = await Report.findById(report._id)
      .populate("reporter", "name email avatar")
      .populate("targetListing", "title images rentalPricePerDay location isActive availability owner")
      .populate("targetUser", "name email avatar")
      .populate("resolvedBy", "username");

    return res.status(200).json({
      success: true,
      message: `Report status updated to ${nextStatus}.`,
      report: populated,
    });
  } catch (error) {
    console.error("Error updating report action:", error);
    return res.status(500).json({ message: "Failed to update report action." });
  }
};
