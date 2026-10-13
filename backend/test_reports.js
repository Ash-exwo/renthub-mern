const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./src/app");
const User = require("./src/models/UserModel");
const Admin = require("./src/models/AdminModel");
const Listing = require("./src/models/ListingModel");
const Report = require("./src/models/ReportModel");
const Notification = require("./src/models/NotificationModel");

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

function makeUserToken(userId) {
  return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: "7d" });
}

function makeAdminToken(adminId) {
  return jwt.sign({ adminId: adminId.toString(), role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

async function runReportTests() {
  console.log("\n=======================================================");
  console.log("   RentHub Reports & Content Moderation Test Suite     ");
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
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  }

  try {
    const host = await User.findById("6ac09934a5f3dbc1b99f578f") || await User.findOne({ email: /ash/i });
    const renter = await User.findById("6acbae1a23a4090dc33c63ef") || await User.findOne({ email: /abhi/i });
    const admin = await Admin.findOne({});

    if (!host || !renter || !admin) {
      throw new Error("Host, renter, and admin accounts must exist in database.");
    }

    const hostToken = makeUserToken(host._id);
    const renterToken = makeUserToken(renter._id);
    const adminToken = makeAdminToken(admin._id);

    let listing = await Listing.findOne({ owner: host._id });
    if (!listing) {
      throw new Error("A listing owned by host Ash must exist in database.");
    }

    // Clean up any test reports for this listing from Abhi
    await Report.deleteMany({ reporter: renter._id, targetListing: listing._id });

    // Ensure listing is active initially
    listing.isActive = true;
    listing.availability = "available";
    await listing.save();

    console.log(`Using Host: ${host.name} (${host.email})`);
    console.log(`Using Renter: ${renter.name} (${renter.email})`);
    console.log(`Using Admin: ${admin.username} (ID: ${admin._id})`);
    console.log(`Using Listing: "${listing.title}" (ID: ${listing._id})`);

    let passed = 0;
    let failed = 0;

    function assert(desc, condition) {
      if (condition) {
        console.log(`  ✅ PASS: ${desc}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${desc}`);
        failed++;
      }
    }

    // TEST 1: Block user reporting their own listing
    console.log("\n--- TEST 1: Self-Report Validation ---");
    const selfRes = await req(
      "/reports",
      "POST",
      {
        targetListingId: listing._id,
        category: "misleading",
        reason: "I am reporting my own listing by mistake.",
      },
      hostToken
    );
    assert("Host cannot report their own listing (400)", selfRes.status === 400);

    // TEST 2: Block reason under 10 characters
    console.log("\n--- TEST 2: Reason Length Validation ---");
    const shortRes = await req(
      "/reports",
      "POST",
      {
        targetListingId: listing._id,
        category: "scam_off_platform",
        reason: "Too short",
      },
      renterToken
    );
    assert("Reason < 10 characters rejected (400)", shortRes.status === 400);

    // TEST 3: Renter submits valid report against listing
    console.log("\n--- TEST 3: Renter Submits Valid Report ---");
    const createRes = await req(
      "/reports",
      "POST",
      {
        targetListingId: listing._id,
        category: "scam_off_platform",
        reason: "Host requested direct cash outside RentHub Escrow during pickup.",
      },
      renterToken
    );
    assert("Renter report created successfully (201)", createRes.status === 201 && createRes.data.success);
    const reportId = createRes.data.report?._id;
    assert("Report ID returned", !!reportId);
    assert("Initial status is 'pending'", createRes.data.report?.status === "pending");

    // TEST 4: Block duplicate pending report from same user
    console.log("\n--- TEST 4: Anti-Spam Duplicate Prevention ---");
    const dupRes = await req(
      "/reports",
      "POST",
      {
        targetListingId: listing._id,
        category: "scam_off_platform",
        reason: "Duplicate report attempt for the same item.",
      },
      renterToken
    );
    assert("Duplicate pending report blocked (400)", dupRes.status === 400);

    // TEST 5: Security - Regular user blocked from admin moderation endpoints
    console.log("\n--- TEST 5: Admin Authorization Security ---");
    const unauthAdminRes = await req("/reports/admin", "GET", null, renterToken);
    assert("Regular user blocked from admin reports list (401)", unauthAdminRes.status === 401);

    // TEST 6: Admin retrieves live reports with status metrics
    console.log("\n--- TEST 6: Admin Retrieves Reports Console ---");
    const adminListRes = await req("/reports/admin", "GET", null, adminToken);
    assert("Admin fetches reports (200)", adminListRes.status === 200 && adminListRes.data.success);
    const foundReport = adminListRes.data.reports?.find((r) => r._id === reportId);
    assert("Abhi's report present in admin list", !!foundReport);
    assert("Populated target listing title", foundReport?.targetListing?.title === listing.title);
    assert("Populated reporter name", foundReport?.reporter?.name === renter.name);
    assert("Pending count is at least 1", adminListRes.data.counts?.pending >= 1);

    // TEST 7: Admin pauses listing and resolves report
    console.log("\n--- TEST 7: Admin Moderation Action (Pause Listing & Resolve) ---");
    const actionRes = await req(
      `/reports/admin/${reportId}/action`,
      "PATCH",
      {
        status: "resolved",
        actionTaken: "listing_paused",
        adminNotes: "Confirmed violation: Off-platform payment demand. Listing paused temporarily.",
      },
      adminToken
    );
    assert("Admin action completed (200)", actionRes.status === 200 && actionRes.data.success);
    assert("Report status is now 'resolved'", actionRes.data.report?.status === "resolved");
    assert("Report actionTaken is 'listing_paused'", actionRes.data.report?.actionTaken === "listing_paused");

    // TEST 8: Verify listing is paused in MongoDB
    console.log("\n--- TEST 8: Listing State Mutation Verification ---");
    const updatedListing = await Listing.findById(listing._id);
    assert("Target listing isActive set to false", updatedListing.isActive === false);
    assert("Target listing availability set to 'unavailable'", updatedListing.availability === "unavailable");

    // TEST 9: In-app notifications verified
    console.log("\n--- TEST 9: In-App Notifications Verification ---");
    const renterNotifRes = await req("/notifications", "GET", null, renterToken);
    const hostNotifRes = await req("/notifications", "GET", null, hostToken);

    const renterNotif = renterNotifRes.data?.notifications?.find(
      (n) => n.title.includes("Report Reviewed") || n.title.includes("Report Received")
    );
    const hostNotif = hostNotifRes.data?.notifications?.find(
      (n) => n.title.includes("Listing Paused")
    );
    assert("Renter received report status notification", !!renterNotif);
    assert("Host received listing paused safety warning notification", !!hostNotif);

    // Restore listing to active state for continuing app tests
    updatedListing.isActive = true;
    updatedListing.availability = "available";
    await updatedListing.save();

    console.log("\n=======================================================");
    console.log(`   Tests Finished: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    if (internalServer) {
      internalServer.close();
    }
  }
}

runReportTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test runner error:", err);
    process.exit(1);
  });
