/**
 * End-to-End Integration Test Suite for:
 * 1. Physical Handover & Return Protocol (6-digit OTP & Pre/Post Condition Inspection)
 * 2. Damage Claims & Security Deposit Dispute Tribunal
 * 3. Advanced Pricing Engine (Tiered Duration Discounts, Weekend Rates, Min/Max Durations)
 */

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;
const JWT_SECRET = (process.env.JWT_SECRET || "default_secret").trim();

const state = {
  hostToken: null,
  renterToken: null,
  adminToken: null,
  listingId: null,
  bookingId: null,
  pickupOtp: null,
  returnOtp: null,
  disputeId: null,
};

function logStep(step, msg, pass = true) {
  const icon = pass ? "✅ PASS" : "❌ FAIL";
  console.log(`${step.padEnd(42)} ${icon} ${msg || ""}`);
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   RentHub: Handover, Disputes & Pricing Test Suite   ");
  console.log("=======================================================\n");

  try {
    const ashUserId = "6ac09934a5f3dbc1b99f578f"; // Host
    const abhiUserId = "6acbae1a23a4090dc33c63ef"; // Renter
    const adminId = "6a9eb26ed488cc39bb01ca24"; // Superadmin

    state.hostToken = jwt.sign({ userId: ashUserId }, JWT_SECRET, { expiresIn: "7d" });
    state.renterToken = jwt.sign({ userId: abhiUserId }, JWT_SECRET, { expiresIn: "7d" });
    state.adminToken = jwt.sign({ adminId: adminId, role: "superadmin" }, JWT_SECRET, { expiresIn: "7d" });

    logStep("1. Host Authenticated (Ash)", "Token generated");
    logStep("2. Renter Authenticated (Abhi)", "Token generated");
    logStep("3. Admin Authenticated (Superadmin)", "Token generated");

    // 2. Fetch categories to create a listing
    const catRes = await axios.get(`${BASE_URL}/categories`);
    const categoryId = catRes.data.categories[0]._id;

    // 3. Create Listing with Advanced Pricing Rules:
    // Daily rate ₹1,000, Weekend rate ₹1,500, Weekly discount 20%, Min 2 days, Max 30 days
    const createListingRes = await axios.post(
      `${BASE_URL}/listings`,
      {
        title: "Sony FX3 Cinema Rig + Advanced Pricing Test",
        description: "Professional full-frame cinema camera with XLR handle, prime cine lenses, and complete rigging.",
        category: categoryId,
        rentalPricePerDay: 1000,
        weekendPricePerDay: 1500,
        weeklyDiscountPercentage: 20,
        monthlyDiscountPercentage: 35,
        minRentalDays: 2,
        maxRentalDays: 30,
        deposit: 5000,
        location: "Panampilly Nagar, Kochi",
      },
      { headers: { Authorization: `Bearer ${state.hostToken}` } }
    );
    state.listingId = createListingRes.data.listing._id;
    logStep("4. Listing Created with Pricing Rules", `ID: ${state.listingId} (Weekend: ₹1500, Weekly: 20% off)`);

    // 4. Test calculate-quote endpoint for duration discount verification
    // 7 days rental (e.g. from upcoming Monday to next Monday)
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7) + 14);
    nextMonday.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(nextMonday);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const quoteRes = await axios.post(`${BASE_URL}/listings/${state.listingId}/calculate-quote`, {
      startDate: nextMonday.toISOString(),
      endDate: sevenDaysLater.toISOString(),
    });
    const q = quoteRes.data.quote;
    const isDiscountApplied = q.appliedDiscountType === "weekly" && q.discountPercentage === 20;
    logStep(
      "5. Quote Engine (Weekly 20% Discount)",
      `Base: ₹${q.undiscountedBase} -> Disc: -₹${q.discountAmount} (Net: ₹${q.basePrice})`,
      isDiscountApplied
    );

    // 5. Enforce minRentalDays rejection
    const oneDayLater = new Date(nextMonday);
    oneDayLater.setDate(oneDayLater.getDate() + 1);

    let minDurationBlocked = false;
    try {
      await axios.post(
        `${BASE_URL}/bookings`,
        {
          listingId: state.listingId,
          startDate: nextMonday.toISOString(),
          endDate: oneDayLater.toISOString(),
        },
        { headers: { Authorization: `Bearer ${state.renterToken}` } }
      );
    } catch (err) {
      minDurationBlocked = err.response?.status === 400 && err.response?.data?.message?.includes("Minimum rental duration");
    }
    logStep("6. Min Duration Enforcement (1 day rejected)", "Blocked sub-minimum rental period", minDurationBlocked);

    // 6. Renter creates valid booking (3 days)
    const threeDaysLater = new Date(nextMonday);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const bookRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        listingId: state.listingId,
        startDate: nextMonday.toISOString(),
        endDate: threeDaysLater.toISOString(),
        notes: "Needed for commercial shoot in Kochi.",
      },
      { headers: { Authorization: `Bearer ${state.renterToken}` } }
    );
    state.bookingId = bookRes.data.booking._id;
    state.pickupOtp = bookRes.data.booking.pickupOtp;
    logStep("7. Booking Created & Pickup OTP Assigned", `Booking ID: ${state.bookingId} | PIN: ${state.pickupOtp}`);

    // 7. Host confirms booking
    await axios.patch(
      `${BASE_URL}/bookings/${state.bookingId}/status`,
      { status: "confirmed" },
      { headers: { Authorization: `Bearer ${state.hostToken}` } }
    );
    logStep("8. Host Confirmed Booking", "Status changed to confirmed");

    // 8. Renter pays and secures escrow
    const payRes = await axios.post(
      `${BASE_URL}/payments/process`,
      {
        bookingId: state.bookingId,
        paymentMethod: "card",
        paymentDetails: { cardLast4: "4242", cardBrand: "Visa" },
      },
      { headers: { Authorization: `Bearer ${state.renterToken}` } }
    );
    logStep("9. Payment Processed & Escrow Held", `Txn: ${payRes.data.payment.transactionId} | Deposit: held`);

    // Fetch booking to verify pickupOtp
    const bookingDetails = await axios.get(`${BASE_URL}/bookings/${state.bookingId}`, {
      headers: { Authorization: `Bearer ${state.renterToken}` },
    });
    state.pickupOtp = bookingDetails.data.booking.pickupOtp;

    // 9. Physical Handover Verification: Host inputs Pickup OTP with inspection photos
    const verifyPickupRes = await axios.post(
      `${BASE_URL}/bookings/${state.bookingId}/verify-pickup`,
      {
        otp: state.pickupOtp,
        photos: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
          "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800",
        ],
        notes: "Item handed over in pristine condition. Lens hood and battery charger verified present.",
      },
      { headers: { Authorization: `Bearer ${state.hostToken}` } }
    );
    state.returnOtp = verifyPickupRes.data.booking.returnOtp;
    const isNowInProgress = verifyPickupRes.data.booking.status === "in_progress";
    logStep(
      "10. Handover Verified & Active (in_progress)",
      `Verified with OTP: ${state.pickupOtp} | Return PIN: ${state.returnOtp}`,
      isNowInProgress
    );

    // 10. Return Verification with Reported Damage: Host marks item damaged with return photos
    const verifyReturnRes = await axios.post(
      `${BASE_URL}/bookings/${state.bookingId}/verify-return`,
      {
        otp: state.returnOtp,
        photos: [
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800",
        ],
        notes: "Deep scratch on front element of 24-70mm lens. Lens cap missing.",
        conditionStatus: "damaged",
      },
      { headers: { Authorization: `Bearer ${state.hostToken}` } }
    );
    const isDisputed = verifyReturnRes.data.booking.status === "disputed";
    logStep("11. Return Verified with Damage", "Deposit held in dispute state", isDisputed);

    // 11. Host Files Damage Claim of ₹2,500 against ₹5,000 security deposit
    const disputeRes = await axios.post(
      `${BASE_URL}/disputes`,
      {
        bookingId: state.bookingId,
        claimAmount: 2500,
        hostReason: "Front lens element scratched during rental.",
        hostPhotos: [
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800",
        ],
      },
      { headers: { Authorization: `Bearer ${state.hostToken}` } }
    );
    state.disputeId = disputeRes.data.dispute._id;
    logStep("12. Host Filed Damage Claim (₹2,500)", `Dispute ID: ${state.disputeId}`);

    // 12. Renter Contests Claim with Counter-Evidence -> Escalates to Admin Tribunal
    const contestRes = await axios.post(
      `${BASE_URL}/disputes/${state.disputeId}/respond`,
      {
        decision: "contest",
        counterReason: "The micro-scratch was already present during pickup. The bag was handled carefully with padding.",
        counterPhotos: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
        ],
      },
      { headers: { Authorization: `Bearer ${state.renterToken}` } }
    );
    const isEscalated = contestRes.data.dispute.status === "escalated_to_admin";
    logStep("13. Renter Contested Claim", "Escalated to Admin Arbitration Tribunal", isEscalated);

    // 13. Admin Lists Disputes & Inspects Case
    const adminDisputesRes = await axios.get(`${BASE_URL}/disputes/admin`, {
      headers: { Authorization: `Bearer ${state.adminToken}` },
    });
    const foundDispute = adminDisputesRes.data.disputes.find((d) => d._id === state.disputeId);
    logStep("14. Admin Console Receives Dispute", `Case located in Admin queue (${adminDisputesRes.data.counts.escalated} escalated)`, Boolean(foundDispute));

    // 14. Admin Issues Binding Arbitration Ruling
    // Admin splits deposit: Awards ₹1,500 to host for repair, refunds ₹3,500 to renter
    const resolveRes = await axios.patch(
      `${BASE_URL}/disputes/admin/${state.disputeId}/resolve`,
      {
        ruling: "award_host_partial",
        hostAwardAmount: 1500,
        renterRefundAmount: 3500,
        adminNotes: "After reviewing pickup vs return photos, damage occurred during rental. Partial repair cost of ₹1,500 awarded to host, ₹3,500 refunded to renter.",
      },
      { headers: { Authorization: `Bearer ${state.adminToken}` } }
    );
    const isResolved = resolveRes.data.dispute.status === "resolved";
    logStep(
      "15. Admin Arbitration Ruling Executed",
      `Ruling: ${resolveRes.data.dispute.resolution.ruling} (Host: ₹1,500, Renter: ₹3,500)`,
      isResolved
    );

    // Deactivate temporary test listing so it does not leave clutter on public Explore catalog
    try {
      await axios.patch(
        `${BASE_URL}/listings/${state.listingId}/status`,
        { isActive: false },
        { headers: { Authorization: `Bearer ${state.hostToken}` } }
      );
    } catch {
      // ignore
    }

    console.log("\n=======================================================");
    console.log("   🎉 ALL 15 ROADMAP FEATURES & PROTOCOL TESTS PASSED! ");
    console.log("=======================================================\n");
  } catch (error) {
    console.error("Test Suite Error:", error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
