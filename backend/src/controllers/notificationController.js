const Notification = require("../models/NotificationModel");

/**
 * Safely create a notification in the background
 * Will not throw or crash the calling transaction if an error occurs.
 */
async function createNotification({
  recipient,
  sender = null,
  type = "general",
  title,
  message,
  booking = null,
  listing = null,
  link = "/notifications",
}) {
  try {
    if (!recipient || !title || !message) {
      console.warn("createNotification missing required fields:", { recipient, title, message });
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      booking,
      listing,
      link,
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
}

/**
 * GET /api/notifications
 * Get paginated or top 50 notifications for the current authenticated user
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user._id || req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 50;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name email")
      .populate("listing", "title images rentalPricePerDay")
      .populate("booking", "startDate endDate totalPrice status")
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      message: "Failed to load notifications.",
      error: error.message,
    });
  }
}

/**
 * GET /api/notifications/unread-count
 * Lightweight unread badge counter for the navbar notification bell
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user._id || req.user.userId;
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return res.status(500).json({
      message: "Failed to fetch unread notification count.",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user._id || req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      message: "Notification marked as read.",
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications for authenticated user as read
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id || req.user.userId;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      message: "All notifications marked as read.",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      message: "Failed to mark all notifications as read.",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
async function deleteNotification(req, res) {
  try {
    const userId = req.user._id || req.user.userId;
    const { id } = req.params;

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      message: "Notification deleted.",
      unreadCount,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for the authenticated user
 */
async function clearAllNotifications(req, res) {
  try {
    const userId = req.user._id || req.user.userId;

    await Notification.deleteMany({ recipient: userId });

    return res.status(200).json({
      message: "All notifications cleared.",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    return res.status(500).json({
      message: "Failed to clear notifications.",
      error: error.message,
    });
  }
}

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
