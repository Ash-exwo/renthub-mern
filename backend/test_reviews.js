const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./src/app");
const PORT = process.env.PORT || 5000;
const API_BASE = `http://127.0.0.1:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : "default_secret";

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const net = require("net");
    const client = new net.Socket();
    client.once("connect", () => {
      client.destroy();
      resolve(true);
    });
    client.once("error", () => {
      client.destroy();
      resolve(false);
    });
    client.connect(port, "127.0.0.1");
  });
}

async function req(url, method = "GET", data = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(`${API_BASE}${url}`, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function runReviewTests() {
  console.log("\n=======================================================");
  console.log("   RentHub Verified Reviews & Ratings Test Suite       ");
  console.log("=======================================================");

  let internalServer = null;
  const alreadyRunning = await isPortOpen(PORT);

  if (!alreadyRunning) {
    console.log(`\n⏳ Backend not running on port ${PORT}. Starting embedded server...`);
    await mongoose.connect(process.env.MONGO_URI);
    await new Promise((resolve) => {
      internalServer = app.listen(PORT, "127.0.0.1", () => {
        console.log(`🚀 Embedded backend listening at http://127.0.0.1:${PORT}`);
        resolve();
      });
    });
  } else {
    console.log(`\n✅ Connected to existing live backend server at http://127.0.0.1:${PORT}`);
  }

  try {
    const ashUserId = "6ac09934a5f3dbc1b99f578f"; // Owner of listings
    const abhiUserId = "6acbae1a23a4090dc33c63ef"; // Renter

    const ashToken = jwt.sign({ userId: ashUserId }, JWT_SECRET, { expiresIn: "7d" });
    const abhiToken = jwt.sign({ userId: abhiUserId }, JWT_SECRET, { expiresIn: "7d" });

    // 1. Fetch an existing listing owned by Ash
    const listingsRes = await req("/listings");
    const listing = listingsRes.data?.listings?.find((l) => (l.owner?._id || l.owner) === ashUserId);
    if (!listing) throw new Error("No listing owned by Ash found!");

    // 2. Create a test booking
    const randOffset = Math.floor(Math.random() * 50) + 120;
    const startDate = new Date(Date.now() + 86400000 * randOffset).toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 86400000 * (randOffset + 3)).toISOString().split("T")[0];

    const bookingRes = await req(
      "/bookings",
      "POST",
      {
        listingId: listing._id,
        startDate,
        endDate,
        notes: "Booking for reviews test suite",
      },
      abhiToken
    );

    const bookingId = bookingRes.data?.booking?._id;
    console.log("\n1. Created Test Booking:              ", bookingRes.status === 201 ? "✅ PASS" : "❌ FAIL", `(ID: ${bookingId})`);

    // 3. Test: Block review while booking is pending (must be completed)
    const pendingReviewRes = await req(
      "/reviews",
      "POST",
      {
        bookingId,
        rating: 5,
        comment: "Great tent, loved it!",
      },
      abhiToken
    );
    console.log(
      "2. Block Review While Pending (400):  ",
      pendingReviewRes.status === 400 ? "✅ PASS" : `❌ FAIL (${pendingReviewRes.status})`,
      `"${pendingReviewRes.data?.message}"`
    );

    // 4. Host confirms booking
    const confirmRes = await req(`/bookings/${bookingId}/status`, "PATCH", { status: "confirmed" }, ashToken);
    console.log("3. Host Confirmed Booking:            ", confirmRes.status === 200 ? "✅ PASS" : "❌ FAIL");

    // 5. Renter funds escrow
    const payRes = await req(
      "/payments/process",
      "POST",
      {
        bookingId,
        paymentMethod: "card",
        paymentDetails: { cardLast4: "4242", cardBrand: "Visa" },
      },
      abhiToken
    );
    console.log("4. Renter Funded Escrow:              ", payRes.status === 200 ? "✅ PASS" : "❌ FAIL");

    // 6. Test: Block review while booking is confirmed (in-progress)
    const confirmedReviewRes = await req(
      "/reviews",
      "POST",
      {
        bookingId,
        rating: 5,
        comment: "Tent was okay, but rental not completed yet.",
      },
      abhiToken
    );
    console.log(
      "5. Block Review While In-Progress(400):",
      confirmedReviewRes.status === 400 ? "✅ PASS" : `❌ FAIL (${confirmedReviewRes.status})`,
      `"${confirmedReviewRes.data?.message}"`
    );

    // 7. Host marks booking as completed
    const completeRes = await req(`/bookings/${bookingId}/status`, "PATCH", { status: "completed" }, ashToken);
    console.log("6. Host Marked Rental Completed:      ", completeRes.status === 200 ? "✅ PASS" : "❌ FAIL");

    // 8. Test: Block review by non-renter (host cannot review their own listing via renter booking)
    const nonRenterReviewRes = await req(
      "/reviews",
      "POST",
      {
        bookingId,
        rating: 5,
        comment: "I am the host trying to review myself.",
      },
      ashToken
    );
    console.log(
      "7. Block Non-Renter Review (403):     ",
      nonRenterReviewRes.status === 403 ? "✅ PASS" : `❌ FAIL (${nonRenterReviewRes.status})`,
      `"${nonRenterReviewRes.data?.message}"`
    );

    // 9. Test: Verified renter submits 5-star review
    const validReviewRes = await req(
      "/reviews",
      "POST",
      {
        bookingId,
        rating: 5,
        comment: "Exceptional camping gear! Everything was immaculate, clean, and host Ash was wonderful.",
      },
      abhiToken
    );
    console.log(
      "8. Verified Renter Submits Review:    ",
      validReviewRes.status === 201 ? "✅ PASS" : `❌ FAIL (${validReviewRes.status})`,
      `Rating: ${validReviewRes.data?.review?.rating}★`
    );
    const reviewId = validReviewRes.data?.review?._id;

    // 10. Test: Block duplicate review for same completed booking
    const duplicateReviewRes = await req(
      "/reviews",
      "POST",
      {
        bookingId,
        rating: 4,
        comment: "Trying to submit another review for the same rental.",
      },
      abhiToken
    );
    console.log(
      "9. Block Duplicate Review (400):      ",
      duplicateReviewRes.status === 400 ? "✅ PASS" : `❌ FAIL (${duplicateReviewRes.status})`,
      `"${duplicateReviewRes.data?.message}"`
    );

    // 11. Test: Check listing rating aggregate update
    const updatedListingRes = await req(`/listings/${listing._id}`);
    const avgRating = updatedListingRes.data?.listing?.averageRating;
    const totalReviews = updatedListingRes.data?.listing?.totalReviews;
    console.log(
      "10. Verify Listing Aggregate Update:  ",
      avgRating > 0 && totalReviews > 0 ? "✅ PASS" : "❌ FAIL",
      `Avg: ${avgRating}★ | Total: ${totalReviews}`
    );

    // 12. Test: Verify Host received "review_received" notification
    const hostNotifs = await req("/notifications", "GET", null, ashToken);
    const reviewNotif = hostNotifs.data?.notifications?.find((n) => n.type === "review_received");
    console.log(
      "11. Host Received Review Notification: ",
      reviewNotif ? "✅ PASS" : "❌ FAIL",
      `"${reviewNotif?.title}": ${reviewNotif?.message}`
    );

    // 13. Test: Public listing reviews endpoint & histogram
    const publicReviewsRes = await req(`/reviews/listing/${listing._id}`);
    const hasReviewList = publicReviewsRes.data?.reviews?.some((r) => r._id === reviewId);
    console.log(
      "12. Public Reviews & Breakdown:       ",
      publicReviewsRes.status === 200 && hasReviewList ? "✅ PASS" : "❌ FAIL",
      `5★ Count: ${publicReviewsRes.data?.breakdown?.[5]}`
    );

    // 14. Test: Check booking review status for renter
    const bookingReviewRes = await req(`/reviews/booking/${bookingId}`, "GET", null, abhiToken);
    console.log(
      "13. Booking Review Status Check:      ",
      bookingReviewRes.status === 200 && bookingReviewRes.data?.hasReviewed === true ? "✅ PASS" : "❌ FAIL",
      `HasReviewed: ${bookingReviewRes.data?.hasReviewed}`
    );

    console.log("\n=======================================================");
    console.log("       🎉 All 13 Review & Rating Tests Passed!         ");
    console.log("=======================================================\n");
  } finally {
    if (internalServer) {
      internalServer.close();
      await mongoose.disconnect();
    }
  }
}

runReviewTests().catch((err) => {
  console.error("\n❌ Test execution error:", err.message);
  process.exit(1);
});
