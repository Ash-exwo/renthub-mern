const Conversation = require("../models/ConversationModel");
const Message = require("../models/MessageModel");
const Listing = require("../models/ListingModel");
const Booking = require("../models/BookingModel");
const User = require("../models/UserModel");
const Notification = require("../models/NotificationModel");

/**
 * GET /api/messages/conversations
 * Query params: role ("renting" | "hosting" | "all")
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { role } = req.query;

    let filter = { status: { $ne: "blocked" } };
    if (role === "renting") {
      filter.renter = userId;
    } else if (role === "hosting") {
      filter.owner = userId;
    } else {
      filter.$or = [{ renter: userId }, { owner: userId }];
    }

    const conversations = await Conversation.find(filter)
      .populate("renter", "name email avatar")
      .populate("owner", "name email avatar")
      .populate("listing", "title images rentalPricePerDay location availability")
      .populate("booking", "status startDate endDate totalAmount paymentStatus")
      .sort({ lastMessageAt: -1 });

    // Calculate unread totals for this user across both sections
    const formatted = conversations.map((c) => {
      const renterId = c.renter?._id ? c.renter._id.toString() : c.renter?.toString();
      const isRenter = renterId === userId.toString();
      const unreadCount = isRenter ? c.unreadCountRenter : c.unreadCountOwner;
      const otherUser = isRenter ? c.owner : c.renter;

      return {
        _id: c._id,
        id: c._id.toString(),
        role: isRenter ? "renting" : "hosting",
        otherUser: otherUser || { name: "User" },
        listing: c.listing,
        booking: c.booking,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount: unreadCount || 0,
        status: c.status,
        createdAt: c.createdAt,
      };
    });

    const totalUnread = formatted.reduce((acc, c) => acc + c.unreadCount, 0);

    return res.status(200).json({
      success: true,
      conversations: formatted,
      totalUnread,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Failed to fetch conversations." });
  }
};

/**
 * POST /api/messages/conversations/init
 * Initialize or retrieve existing conversation thread
 * Body: { listingId, ownerId, bookingId }
 */
exports.initConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listingId, ownerId, bookingId } = req.body;

    let resolvedListingId = listingId;
    let resolvedOwnerId = ownerId;
    let resolvedRenterId = userId;
    let linkedBooking = null;

    if (bookingId) {
      linkedBooking = await Booking.findById(bookingId);
      if (!linkedBooking) {
        return res.status(404).json({ message: "Referenced booking not found." });
      }

      const isParticipant =
        linkedBooking.renter.toString() === userId.toString() ||
        linkedBooking.owner.toString() === userId.toString();

      if (!isParticipant) {
        return res.status(403).json({ message: "Unauthorized to access this booking's conversation." });
      }

      resolvedListingId = linkedBooking.listing;
      resolvedOwnerId = linkedBooking.owner;
      resolvedRenterId = linkedBooking.renter;
    } else {
      if (!resolvedListingId) {
        return res.status(400).json({ message: "Listing ID is required to initiate chat." });
      }

      const listing = await Listing.findById(resolvedListingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found." });
      }

      resolvedOwnerId = listing.owner;
      resolvedRenterId = userId;
    }

    if (resolvedOwnerId.toString() === resolvedRenterId.toString()) {
      return res.status(400).json({ message: "You cannot start a conversation with yourself." });
    }

    // Find existing or create new
    let conv = await Conversation.findOne({
      listing: resolvedListingId,
      renter: resolvedRenterId,
      owner: resolvedOwnerId,
    });

    if (conv) {
      // If booking was provided and not attached, attach it
      if (bookingId && (!conv.booking || conv.booking.toString() !== bookingId.toString())) {
        conv.booking = bookingId;
        await conv.save();
      }
    } else {
      conv = await Conversation.create({
        renter: resolvedRenterId,
        owner: resolvedOwnerId,
        listing: resolvedListingId,
        booking: bookingId || null,
        lastMessage: "Conversation opened.",
        lastMessageAt: new Date(),
      });
    }

    const populated = await Conversation.findById(conv._id)
      .populate("renter", "name email avatar")
      .populate("owner", "name email avatar")
      .populate("listing", "title images rentalPricePerDay location availability")
      .populate("booking", "status startDate endDate totalAmount paymentStatus");

    const isRenter = populated.renter?._id?.toString() === userId.toString();
    const otherUser = isRenter ? populated.owner : populated.renter;

    return res.status(200).json({
      success: true,
      conversation: {
        _id: populated._id,
        id: populated._id.toString(),
        role: isRenter ? "renting" : "hosting",
        otherUser,
        listing: populated.listing,
        booking: populated.booking,
        lastMessage: populated.lastMessage,
        lastMessageAt: populated.lastMessageAt,
        unreadCount: isRenter ? populated.unreadCountRenter : populated.unreadCountOwner,
        status: populated.status,
      },
    });
  } catch (error) {
    console.error("Error initiating conversation:", error);
    return res.status(500).json({ message: "Failed to initiate conversation." });
  }
};

/**
 * GET /api/messages/conversation/:conversationId
 * Fetch full message thread & mark as read for current user
 */
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conv = await Conversation.findById(conversationId)
      .populate("renter", "name email avatar")
      .populate("owner", "name email avatar")
      .populate("listing", "title images rentalPricePerDay location availability")
      .populate("booking", "status startDate endDate totalAmount paymentStatus");

    if (!conv) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const renterId = conv.renter?._id ? conv.renter._id.toString() : conv.renter?.toString();
    const isRenter = renterId === userId.toString();
    const ownerId = conv.owner?._id ? conv.owner._id.toString() : conv.owner?.toString();
    const isOwner = ownerId === userId.toString();

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: "You are not authorized to view this conversation." });
    }

    // Mark unread messages sent by the counterparty as read
    await Message.updateMany(
      {
        conversation: conv._id,
        sender: { $ne: userId },
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    // Reset unread counter for current user
    if (isRenter && conv.unreadCountRenter > 0) {
      conv.unreadCountRenter = 0;
      await conv.save();
    } else if (isOwner && conv.unreadCountOwner > 0) {
      conv.unreadCountOwner = 0;
      await conv.save();
    }

    // Retrieve full ordered message history
    const messages = await Message.find({ conversation: conv._id })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    const otherUser = isRenter ? conv.owner : conv.renter;

    return res.status(200).json({
      success: true,
      conversation: {
        _id: conv._id,
        id: conv._id.toString(),
        role: isRenter ? "renting" : "hosting",
        otherUser,
        listing: conv.listing,
        booking: conv.booking,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        status: conv.status,
      },
      messages: messages.map((m) => ({
        _id: m._id,
        id: m._id.toString(),
        sender: m.sender,
        isMe: m.sender?._id?.toString() === userId.toString(),
        text: m.text,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Failed to fetch messages." });
  }
};

/**
 * POST /api/messages
 * Send a message
 * Body: { conversationId, text } or { listingId, ownerId, bookingId, text }
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, text, listingId, ownerId, bookingId } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty." });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 2000) {
      return res.status(400).json({ message: "Message cannot exceed 2000 characters." });
    }

    let conv = null;

    if (conversationId) {
      conv = await Conversation.findById(conversationId);
      if (!conv) {
        return res.status(404).json({ message: "Conversation not found." });
      }
    } else if (listingId || bookingId) {
      // Find or create on the fly
      let resolvedListingId = listingId;
      let resolvedOwnerId = ownerId;
      let resolvedRenterId = userId;

      if (bookingId) {
        const b = await Booking.findById(bookingId);
        if (b) {
          resolvedListingId = b.listing;
          resolvedOwnerId = b.owner;
          resolvedRenterId = b.renter;
        }
      } else {
        const l = await Listing.findById(listingId);
        if (l) resolvedOwnerId = l.owner;
      }

      if (resolvedOwnerId.toString() === resolvedRenterId.toString()) {
        return res.status(400).json({ message: "Cannot send a message to yourself." });
      }

      conv = await Conversation.findOne({
        listing: resolvedListingId,
        renter: resolvedRenterId,
        owner: resolvedOwnerId,
      });

      if (!conv) {
        conv = await Conversation.create({
          renter: resolvedRenterId,
          owner: resolvedOwnerId,
          listing: resolvedListingId,
          booking: bookingId || null,
          lastMessage: trimmedText,
          lastMessageAt: new Date(),
        });
      }
    } else {
      return res.status(400).json({ message: "Missing conversation identifier." });
    }

    const isRenter = conv.renter.toString() === userId.toString();
    const isOwner = conv.owner.toString() === userId.toString();

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: "You are not authorized to send messages in this thread." });
    }

    // Create the message
    const newMsg = await Message.create({
      conversation: conv._id,
      sender: userId,
      text: trimmedText,
      isRead: false,
    });

    // Update conversation metadata
    conv.lastMessage = trimmedText;
    conv.lastMessageAt = new Date();
    if (isRenter) {
      conv.unreadCountOwner = (conv.unreadCountOwner || 0) + 1;
    } else {
      conv.unreadCountRenter = (conv.unreadCountRenter || 0) + 1;
    }
    await conv.save();

    // Populate sender details for the response
    const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email avatar");

    // Dispatch in-app notification to the recipient
    const recipientId = isRenter ? conv.owner : conv.renter;
    try {
      const senderUser = await User.findById(userId).select("name");
      const snippet = trimmedText.length > 70 ? `${trimmedText.substring(0, 67)}...` : trimmedText;

      await Notification.create({
        recipient: recipientId,
        sender: userId,
        type: "new_message",
        title: `Message from ${senderUser?.name || "Rental Partner"} 💬`,
        message: snippet,
        booking: conv.booking || null,
        listing: conv.listing || null,
        link: `/messages?conversationId=${conv._id}`,
      });
    } catch (notifErr) {
      console.error("Warning: Failed to create message notification:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: {
        _id: populatedMsg._id,
        id: populatedMsg._id.toString(),
        sender: populatedMsg.sender,
        isMe: true,
        text: populatedMsg.text,
        isRead: false,
        createdAt: populatedMsg.createdAt,
      },
      conversation: {
        _id: conv._id,
        id: conv._id.toString(),
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Failed to send message." });
  }
};
