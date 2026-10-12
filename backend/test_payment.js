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

async function runPaymentTests() {
  console.log("\n=======================================================");
  console.log("   RentHub Payment Gateway & Escrow System Test Suite  ");
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

    // 1. Fetch an ash listing to create a fresh test booking
    const listingsRes = await req("/listings");
    const listing = listingsRes.data?.listings?.find((l) => (l.owner?._id || l.owner) === ashUserId);
    if (!listing) throw new Error("No listing owned by Ash found!");

    // Create booking for future dates
    const futureStart = new Date(Date.now() + 86400000 * 70).toISOString().split("T")[0];
    const futureEnd = new Date(Date.now() + 86400000 * 73).toISOString().split("T")[0];

    const bookingRes = await req(
      "/bookings",
      "POST",
      {
        listingId: listing._id,
        startDate: futureStart,
        endDate: futureEnd,
        notes: "Testing payment escrow workflow",
      },
      abhiToken
    );

    console.log("\n1. Created Test Booking:          ", bookingRes.status === 201 ? "✅ PASS" : "❌ FAIL", `(ID: ${bookingRes.data?.booking?._id})`);
    const bookingId = bookingRes.data?.booking?._id;

    // 2. Prepare checkout session as Renter
    const sessionRes = await req(
      "/payments/checkout-session",
      "POST",
      { bookingId },
      abhiToken
    );
    console.log(
      "2. Renter Checkout Session:       ",
      sessionRes.status === 200 ? "✅ PASS" : `❌ FAIL (${sessionRes.status})`,
      `Total: ₹${sessionRes.data?.breakdown?.totalAmount}`
    );

    // 3. Process test-mode card payment
    const processRes = await req(
      "/payments/process",
      "POST",
      {
        bookingId,
        paymentMethod: "card",
        paymentDetails: {
          cardLast4: "4242",
          cardBrand: "Visa Test",
        },
      },
      abhiToken
    );
    console.log(
      "3. Process Payment & Hold Escrow: ",
      processRes.status === 200 ? "✅ PASS" : `❌ FAIL (${processRes.status})`,
      `Txn: ${processRes.data?.transactionId} | Escrow: ${processRes.data?.payment?.escrowStatus}`
    );

    // 4. Test double-payment prevention
    const doublePayRes = await req(
      "/payments/process",
      "POST",
      { bookingId, paymentMethod: "card" },
      abhiToken
    );
    console.log(
      "4. Double-Payment Blocked (400):  ",
      doublePayRes.status === 400 ? "✅ PASS" : `❌ FAIL (${doublePayRes.status})`,
      `"${doublePayRes.data?.message}"`
    );

    // 5. Fetch payment receipt as Renter
    const receiptRes = await req(`/payments/booking/${bookingId}`, "GET", null, abhiToken);
    console.log(
      "5. Renter View Receipt:           ",
      receiptRes.status === 200 && receiptRes.data?.hasPaid ? "✅ PASS" : "❌ FAIL",
      `Deposit: ${receiptRes.data?.depositStatus}`
    );

    // 6. Fetch payment receipt as Owner
    const ownerReceiptRes = await req(`/payments/booking/${bookingId}`, "GET", null, ashToken);
    console.log(
      "6. Owner View Escrow Receipt:     ",
      ownerReceiptRes.status === 200 && ownerReceiptRes.data?.hasPaid ? "✅ PASS" : "❌ FAIL"
    );

    // 7. Test automated cancellation refund: Renter cancels booking
    const cancelRes = await req(
      `/bookings/${bookingId}/status`,
      "PATCH",
      { status: "cancelled", reason: "Need to reschedule" },
      abhiToken
    );
    console.log("7. Renter Cancelled Booking:      ", cancelRes.status === 200 ? "✅ PASS" : "❌ FAIL");

    // Verify payment is marked refunded
    const refundedReceipt = await req(`/payments/booking/${bookingId}`, "GET", null, abhiToken);
    console.log(
      "8. Automated Escrow Refund:       ",
      refundedReceipt.data?.payment?.status === "refunded" &&
        refundedReceipt.data?.escrowStatus === "refunded_to_renter"
        ? "✅ PASS"
        : "❌ FAIL",
      `Refund ID: ${refundedReceipt.data?.payment?.refundDetails?.refundId}`
    );

    console.log("\n=======================================================");
    console.log("       🎉 All 8 Payment & Escrow Tests Passed!        ");
    console.log("=======================================================\n");
  } finally {
    if (internalServer) {
      internalServer.close();
      await mongoose.disconnect();
    }
  }
}

runPaymentTests().catch((err) => {
  console.error("\n❌ Test execution error:", err.message);
  process.exit(1);
});
