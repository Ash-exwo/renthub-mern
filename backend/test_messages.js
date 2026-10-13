const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./src/app");
const User = require("./src/models/UserModel");
const Listing = require("./src/models/ListingModel");
const Conversation = require("./src/models/ConversationModel");
const Message = require("./src/models/MessageModel");
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

function makeToken(userId) {
  return jwt.sign(
    {
      userId: userId.toString(),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function runMessageTests() {
  console.log("\n=======================================================");
  console.log("   RentHub Real-Time Messaging & 2-Section Inbox Tests ");
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
    // 1. Fetch test users
    const host = await User.findById("6ac09934a5f3dbc1b99f578f") || await User.findOne({ email: /ash/i });
    const renter = await User.findById("6acbae1a23a4090dc33c63ef") || await User.findOne({ email: /abhi/i });
    const thirdParty = await User.findById("6ac7c19d12ac682c02afd89f") || await User.findOne({ email: /ajay/i });

    if (!host || !renter) {
      throw new Error("Test users for Host and Renter must exist in the database.");
    }

    const hostToken = makeToken(host._id);
    const renterToken = makeToken(renter._id);
    const thirdToken = makeToken(thirdParty._id);

    let listing = await Listing.findOne({ owner: host._id });
    if (!listing) {
      // Find any listing
      listing = await Listing.findOne({});
      if (listing) {
        listing.owner = host._id;
        await listing.save();
      } else {
        throw new Error("A listing owned by host Ash must exist in the database.");
      }
    }

    // Clean up test conversations between Abhi and Ash for this listing
    await Conversation.deleteMany({ listing: listing._id, renter: renter._id });

    console.log(`\nUsing Host: ${host.name} (${host.email})`);
    console.log(`Using Renter: ${renter.name} (${renter.email})`);
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

    // TEST 1: Block user chatting with themselves
    console.log("\n--- TEST 1: Self-Chat Validation ---");
    const selfRes = await req("/messages/conversations/init", "POST", { listingId: listing._id }, hostToken);
    assert("Host cannot start conversation on their own listing", selfRes.status === 400);

    // TEST 2: Renter initializes conversation with Host
    console.log("\n--- TEST 2: Initialize Conversation ---");
    const initRes = await req("/messages/conversations/init", "POST", { listingId: listing._id }, renterToken);
    assert("Renter successfully initializes conversation (200)", initRes.status === 200 && initRes.data.success);
    const convId = initRes.data.conversation?._id;
    assert("Conversation ID returned", !!convId);

    // TEST 3: Validate empty message rejected
    console.log("\n--- TEST 3: Message Validation ---");
    const emptyRes = await req("/messages", "POST", { conversationId: convId, text: "   " }, renterToken);
    assert("Empty message rejected with 400", emptyRes.status === 400);

    // TEST 4: Renter sends message to Host
    console.log("\n--- TEST 4: Renter Sends Message to Host ---");
    const sendRes = await req(
      "/messages",
      "POST",
      {
        conversationId: convId,
        text: "Hi Ash! Is this equipment available for pickup this Saturday at 10 AM?",
      },
      renterToken
    );
    assert("Renter message created (201)", sendRes.status === 201 && sendRes.data.success);
    assert("Returned message has isMe = true", sendRes.data.message?.isMe === true);
    assert("Returned conversation updated lastMessage", sendRes.data.conversation?.lastMessage.includes("Saturday"));

    // TEST 5: Verify Host Inbox has 1 Unread in "Hosting" tab
    console.log("\n--- TEST 5: Host 'Hosting' Inbox Segregation & Unread Count ---");
    const hostInboxRes = await req("/messages/conversations?role=hosting", "GET", null, hostToken);
    assert("Host inbox request succeeds (200)", hostInboxRes.status === 200 && hostInboxRes.data.success);
    const hostConv = hostInboxRes.data.conversations.find((c) => c._id === convId);
    assert("Host sees conversation in 'hosting' tab", !!hostConv && hostConv.role === "hosting");
    assert("Host sees otherUser as Renter Abhi", hostConv?.otherUser?.email === renter.email);
    assert("Host has unreadCount = 1", hostConv?.unreadCount === 1);

    // TEST 6: Verify Renter Inbox has conversation in "Renting" tab
    console.log("\n--- TEST 6: Renter 'Renting' Inbox Segregation ---");
    const renterInboxRes = await req("/messages/conversations?role=renting", "GET", null, renterToken);
    assert("Renter inbox request succeeds (200)", renterInboxRes.status === 200 && renterInboxRes.data.success);
    const renterConv = renterInboxRes.data.conversations.find((c) => c._id === convId);
    assert("Renter sees conversation in 'renting' tab", !!renterConv && renterConv.role === "renting");
    assert("Renter has unreadCount = 0 (since they were the sender)", renterConv?.unreadCount === 0);

    // TEST 7: Host opens conversation -> auto mark messages read & reset counter
    console.log("\n--- TEST 7: Read Receipt & Unread Counter Reset ---");
    const hostThreadRes = await req(`/messages/conversation/${convId}`, "GET", null, hostToken);
    assert("Host reads thread messages (200)", hostThreadRes.status === 200 && hostThreadRes.data.messages.length > 0);
    assert("Incoming message marked as read", hostThreadRes.data.messages[0].isRead === true);

    const hostInboxAfter = await req("/messages/conversations?role=hosting", "GET", null, hostToken);
    const hostConvAfter = hostInboxAfter.data.conversations.find((c) => c._id === convId);
    assert("Host unread counter reset to 0 after viewing thread", hostConvAfter?.unreadCount === 0);

    // TEST 8: Host replies to Renter
    console.log("\n--- TEST 8: Host Replies to Renter ---");
    const replyRes = await req(
      "/messages",
      "POST",
      {
        conversationId: convId,
        text: "Hey Abhi! Yes, 10 AM is perfect. It's fully charged and packed with all cables.",
      },
      hostToken
    );
    assert("Host reply sent (201)", replyRes.status === 201 && replyRes.data.success);

    // TEST 9: Renter fetches thread and sees Host's reply
    console.log("\n--- TEST 9: Renter Receives Real-Time Reply ---");
    const renterThreadRes = await req(`/messages/conversation/${convId}`, "GET", null, renterToken);
    assert("Renter retrieves 2 total messages", renterThreadRes.data.messages.length === 2);
    const lastMsg = renterThreadRes.data.messages[1];
    assert("Last message sender is Host", lastMsg.sender?.email === host.email);
    assert("Last message isMe = false for Renter", lastMsg.isMe === false);
    assert("Reply text matches expected", lastMsg.text.includes("fully charged"));

    // TEST 10: In-app Notification Verification
    console.log("\n--- TEST 10: In-App Message Notifications ---");
    const notifRes = await req("/notifications", "GET", null, renterToken);
    assert("Renter notifications retrieved (200)", notifRes.status === 200);
    const msgNotif = notifRes.data.notifications?.find(
      (n) => n.type === "new_message" && n.sender?.email === host.email
    );
    assert("Renter received 'new_message' in-app notification from Host", !!msgNotif);

    // TEST 11: Security & Authorization Eavesdropping Protection
    console.log("\n--- TEST 11: Privacy & Authorization Protection ---");
    const unauthorizedRes = await req(`/messages/conversation/${convId}`, "GET", null, thirdToken);
    assert("Third party blocked from reading private chat (403)", unauthorizedRes.status === 403);

    const unauthorizedSendRes = await req(
      "/messages",
      "POST",
      { conversationId: convId, text: "I am an unauthorized interloper" },
      thirdToken
    );
    assert("Third party blocked from sending message to private thread (403)", unauthorizedSendRes.status === 403);

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

runMessageTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test runner error:", err);
    process.exit(1);
  });
