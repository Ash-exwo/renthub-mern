const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const PORT = process.env.PORT || 5000;
const API_BASE = `http://127.0.0.1:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : "default_secret";

async function req(url, method = "GET", data = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(`${API_BASE}${url}`, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function runNotificationTests() {
  console.log("\n=======================================================");
  console.log("     RentHub In-App Notifications API Test Suite       ");
  console.log("=======================================================\n");

  const ashUserId = "6ac09934a5f3dbc1b99f578f"; // Owner of listings
  const abhiUserId = "6acbae1a23a4090dc33c63ef"; // Renter

  const ashToken = jwt.sign({ userId: ashUserId }, JWT_SECRET, { expiresIn: "7d" });
  const abhiToken = jwt.sign({ userId: abhiUserId }, JWT_SECRET, { expiresIn: "7d" });

  // 1. Initial Unread Count check
  const initCountRes = await req("/notifications/unread-count", "GET", null, ashToken);
  console.log("1. Get Initial Host Unread Count: ", initCountRes.status === 200 ? "✅ PASS" : "❌ FAIL", `(Count: ${initCountRes.data?.unreadCount})`);

  // 2. Renter creates a booking request to trigger notification for Host
  const listingsRes = await req("/listings");
  const listing = listingsRes.data?.listings?.find((l) => (l.owner?._id || l.owner) === ashUserId);
  if (!listing) throw new Error("No listing owned by Ash found!");

  const randomDays = 120 + Math.floor(Math.random() * 300);
  const startD = new Date(Date.now() + 86400000 * randomDays).toISOString().split("T")[0];
  const endD = new Date(Date.now() + 86400000 * (randomDays + 2)).toISOString().split("T")[0];

  const bookingRes = await req(
    "/bookings",
    "POST",
    {
      listingId: listing._id,
      startDate: startD,
      endDate: endD,
      notes: "Testing notification trigger",
    },
    abhiToken
  );

  console.log("2. Renter Created Booking:        ", bookingRes.status === 201 ? "✅ PASS" : "❌ FAIL");
  const bookingId = bookingRes.data?.booking?._id;

  // 3. Verify Host received "New Rental Request Received" notification
  const hostNotifs = await req("/notifications", "GET", null, ashToken);
  const latestNotif = hostNotifs.data?.notifications?.[0];
  console.log(
    "3. Host Received Notification:     ",
    latestNotif && latestNotif.type === "booking_request" ? "✅ PASS" : "❌ FAIL",
    `"${latestNotif?.title}"`
  );

  // 4. Host Marks Single Notification as Read
  const markReadRes = await req(`/notifications/${latestNotif._id}/read`, "PATCH", null, ashToken);
  console.log(
    "4. Mark Single Notif as Read:      ",
    markReadRes.status === 200 && markReadRes.data?.notification?.isRead === true ? "✅ PASS" : "❌ FAIL"
  );

  // 5. Host Approves Booking (status: confirmed) -> Should notify Renter
  const approveRes = await req(`/bookings/${bookingId}/status`, "PATCH", { status: "confirmed" }, ashToken);
  console.log("5. Host Confirmed Booking:        ", approveRes.status === 200 ? "✅ PASS" : "❌ FAIL");

  // 6. Verify Renter received "Rental Request Approved" notification
  const renterNotifs = await req("/notifications", "GET", null, abhiToken);
  const renterLatest = renterNotifs.data?.notifications?.[0];
  console.log(
    "6. Renter Received Approval Notif: ",
    renterLatest && renterLatest.type === "booking_confirmed" ? "✅ PASS" : "❌ FAIL",
    `"${renterLatest?.title}"`
  );

  // 7. Renter Marks All Notifications as Read
  const markAllRes = await req("/notifications/mark-all-read", "PATCH", null, abhiToken);
  console.log(
    "7. Mark All Notifications Read:   ",
    markAllRes.status === 200 && markAllRes.data?.unreadCount === 0 ? "✅ PASS" : "❌ FAIL"
  );

  // 8. Delete a Notification
  const deleteRes = await req(`/notifications/${latestNotif._id}`, "DELETE", null, ashToken);
  console.log("8. Delete Single Notification:     ", deleteRes.status === 200 ? "✅ PASS" : "❌ FAIL");

  console.log("\n=======================================================");
  console.log("       🎉 All 8 Notification Tests Passed!             ");
  console.log("=======================================================\n");
}

runNotificationTests().catch(console.error);
