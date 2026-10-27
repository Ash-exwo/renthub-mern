const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
require("../models/CategoryModel"); // Ensure Category schema is registered
const Listing = require("../models/ListingModel");
const Category = require("../models/CategoryModel");
const Booking = require("../models/BookingModel");
const Payment = require("../models/PaymentModel");

exports.adminLogin = async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    const admin = await Admin.findOne({ username });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Admin login successful.",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
};

/**
 * Helper to compute SVG coordinates (x, y, cmpY) for a series
 */
function mapSeriesCoordinates(rawPoints) {
  const n = rawPoints.length;
  if (n === 0) return [];

  const maxRev = Math.max(...rawPoints.map((p) => p.revenue || 0), 0);
  const maxCmp = Math.max(...rawPoints.map((p) => p.cmpRevenue || 0), 0);
  const scaleMax = Math.max(maxRev, maxCmp);

  return rawPoints.map((p, idx) => {
    const x = n > 1 ? Math.round(20 + idx * (360 / (n - 1))) : 200;
    let y = 150;
    let cmpY = 160;

    if (scaleMax > 0) {
      y = Math.round(155 - ((p.revenue || 0) / scaleMax) * 130);
      cmpY = Math.round(155 - ((p.cmpRevenue || 0) / scaleMax) * 130);
    }

    return {
      label: p.label,
      revenue: p.revenue || 0,
      bookings: p.bookings || 0,
      x,
      y,
      cmpY,
    };
  });
}

/**
 * GET /api/admin/analytics
 * Dynamic analytics aggregated from live MongoDB collections
 */
exports.getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // 1. Fetch live Payments & Bookings
    const [payments, bookings, listings, totalCategoriesCount] = await Promise.all([
      Payment.find({ status: "succeeded" }).lean(),
      Booking.find().lean(),
      Listing.find({ isActive: true }).populate("category").lean(),
      Category.countDocuments(),
    ]);

    // Financial Totals
    const paymentRevenue = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const paidBookings = bookings.filter((b) =>
      ["escrow_held", "payout_released"].includes(b.paymentStatus)
    );
    const bookingRevenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalRevenue = Math.max(paymentRevenue, bookingRevenue);

    // Platform Service Fee & Avg Commission ROI
    const totalServiceFee = payments.reduce(
      (sum, p) => sum + (p.breakdown?.serviceFee || 0),
      0
    );
    const averageRoi =
      totalRevenue > 0
        ? Number(((totalServiceFee / totalRevenue) * 100).toFixed(1))
        : 5.0;

    // Monthly Growth (Last 30 days vs 30-60 days prior)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const current30Payments = payments.filter((p) => new Date(p.createdAt) >= thirtyDaysAgo);
    const prev30Payments = payments.filter((p) => {
      const dt = new Date(p.createdAt);
      return dt >= sixtyDaysAgo && dt < thirtyDaysAgo;
    });

    const current30Rev = current30Payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const prev30Rev = prev30Payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    let growthPercentage = 0;
    if (prev30Rev > 0) {
      growthPercentage = ((current30Rev - prev30Rev) / prev30Rev) * 100;
    } else if (current30Rev > 0) {
      growthPercentage = 100;
    }

    const growthFormatted = `${growthPercentage >= 0 ? "+" : ""}${growthPercentage.toFixed(1)}%`;

    // 2. Chart Series: 7D (trailing 7 days)
    const raw7D = [];
    for (let i = 6; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999);

      const dayPayments = payments.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt >= dayStart && dt <= dayEnd;
      });
      const dayPaidBookings = paidBookings.filter((b) => {
        const dt = new Date(b.createdAt);
        return dt >= dayStart && dt <= dayEnd;
      });
      const dayBookings = bookings.filter((b) => {
        const dt = new Date(b.createdAt);
        return dt >= dayStart && dt <= dayEnd;
      });

      const dayRev = Math.max(
        dayPayments.reduce((s, p) => s + (p.totalAmount || 0), 0),
        dayPaidBookings.reduce((s, b) => s + (b.totalPrice || 0), 0)
      );

      // Prior 7-day comparison
      const cmpStart = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const cmpEnd = new Date(dayEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const cmpPayments = payments.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt >= cmpStart && dt <= cmpEnd;
      });
      const cmpRev = cmpPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);

      raw7D.push({
        label: target.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: dayRev,
        bookings: dayBookings.length,
        cmpRevenue: cmpRev,
      });
    }

    // 3. Chart Series: 30D (4 weekly buckets W1 to W4)
    const raw30D = [];
    for (let w = 3; w >= 0; w--) {
      const wEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const wStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);

      const weekPayments = payments.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt >= wStart && dt <= wEnd;
      });
      const weekPaidBookings = paidBookings.filter((b) => {
        const dt = new Date(b.createdAt);
        return dt >= wStart && dt <= wEnd;
      });
      const weekBookings = bookings.filter((b) => {
        const dt = new Date(b.createdAt);
        return dt >= wStart && dt <= wEnd;
      });

      const weekRev = Math.max(
        weekPayments.reduce((s, p) => s + (p.totalAmount || 0), 0),
        weekPaidBookings.reduce((s, b) => s + (b.totalPrice || 0), 0)
      );

      const cmpStart = new Date(wStart.getTime() - 28 * 24 * 60 * 60 * 1000);
      const cmpEnd = new Date(wEnd.getTime() - 28 * 24 * 60 * 60 * 1000);
      const cmpPayments = payments.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt >= cmpStart && dt <= cmpEnd;
      });
      const cmpRev = cmpPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);

      raw30D.push({
        label: `W${4 - w}`,
        revenue: weekRev,
        bookings: weekBookings.length,
        cmpRevenue: cmpRev,
      });
    }

    // 4. Chart Series: 12M (Trailing 6 calendar months)
    const raw12M = [];
    for (let m = 5; m >= 0; m--) {
      const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mStart = new Date(target.getFullYear(), target.getMonth(), 1, 0, 0, 0, 0);
      const mEnd = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);

      const mPayments = payments.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt >= mStart && dt <= mEnd;
      });
      const mPaidBookings = paidBookings.filter((b) => {
        const dt = new Date(b.createdAt);
        return dt >= mStart && dt <= mEnd;
      });
      const mBookings = bookings.filter((b) => {
        const dt = new Date(b.createdAt);
        return dt >= mStart && dt <= mEnd;
      });

      const mRev = Math.max(
        mPayments.reduce((s, p) => s + (p.totalAmount || 0), 0),
        mPaidBookings.reduce((s, b) => s + (b.totalPrice || 0), 0)
      );

      const cmpStart = new Date(target.getFullYear() - 1, target.getMonth(), 1, 0, 0, 0, 0);
      const cmpEnd = new Date(target.getFullYear() - 1, target.getMonth() + 1, 0, 23, 59, 59, 999);
      const cmpPayments = payments.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt >= cmpStart && dt <= cmpEnd;
      });
      const cmpRev = cmpPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);

      raw12M.push({
        label: target.toLocaleDateString("en-US", { month: "short" }),
        revenue: mRev,
        bookings: mBookings.length,
        cmpRevenue: cmpRev,
      });
    }

    // Map Coordinates
    const series7D = mapSeriesCoordinates(raw7D);
    const series30D = mapSeriesCoordinates(raw30D);
    const series12M = mapSeriesCoordinates(raw12M);

    // 5. Category Demand Breakdown
    const catMap = {};
    listings.forEach((l) => {
      const cId = l.category?._id?.toString() || "uncategorized";
      if (!catMap[cId]) {
        catMap[cId] = {
          id: cId,
          name: l.category?.name || "General",
          icon: l.category?.icon || "📦",
          count: 0,
        };
      }
      catMap[cId].count += 1;
    });

    const sortedCats = Object.values(catMap).sort((a, b) => b.count - a.count);
    const totalActiveListings = listings.length;
    const categoryBreakdown = sortedCats.map((c) => ({
      ...c,
      share: totalActiveListings > 0 ? Math.round((c.count / totalActiveListings) * 100) : 0,
    }));

    const categoriesWithListings = Object.keys(catMap).length;
    const activeDemandPercentage =
      totalCategoriesCount > 0
        ? Math.round((categoriesWithListings / totalCategoriesCount) * 100)
        : 0;

    // 6. Daily Booking Volume & Peak Day
    const dailyVolume = series7D.map((d) => ({
      label: d.label,
      bookings: d.bookings,
    }));

    let peakDay = dailyVolume.reduce((best, cur) => {
      return cur.bookings > best.bookings ? cur : best;
    }, dailyVolume[dailyVolume.length - 1] || { label: "Today", bookings: 0 });

    const maxDailyBookings = Math.max(...dailyVolume.map((d) => d.bookings), 1);

    return res.status(200).json({
      success: true,
      totalRevenue,
      monthlyGrowth: growthFormatted,
      averageRoi: `+${averageRoi}% Avg ROI`,
      chartData: {
        "7D": series7D,
        "30D": series30D,
        "12M": series12M,
      },
      categoryDemand: {
        activeDemandPercentage,
        categories: categoryBreakdown,
        totalCategories: totalCategoriesCount,
      },
      dailyBookingVolume: {
        days: dailyVolume,
        peakDay,
        maxBookings: maxDailyBookings,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return res.status(500).json({
      message: "Failed to generate administrative analytics.",
    });
  }
};
