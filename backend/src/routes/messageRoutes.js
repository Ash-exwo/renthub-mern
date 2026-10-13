const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { protectUser } = require("../middleware/userAuthMiddleware");

// All message routes require user authentication
router.use(protectUser);

// Retrieve conversations for logged-in user (?role=renting|hosting)
router.get("/conversations", messageController.getConversations);

// Initialize or lookup conversation by listing/booking
router.post("/conversations/init", messageController.initConversation);

// Retrieve all messages for a specific conversation thread
router.get("/conversation/:conversationId", messageController.getMessages);

// Send a message
router.post("/", messageController.sendMessage);

module.exports = router;
