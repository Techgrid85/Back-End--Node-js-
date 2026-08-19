const Notification = require("../Models/notificationModel.js");
const mongoose = require("mongoose");

const getNotifications = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = { recipient: req.user.id };
    if (req.query.unread === "true") filter.isRead = false;
    const [data, total, unreadCount] = await Promise.all([
      Notification.find(filter).populate("actor", "name role flatNo").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);
    return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  return res.json({ success: true, unreadCount: count });
};

const markAsRead = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid notification ID" });
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { isRead: true, readAt: new Date() }, { new: true });
  if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
  return res.json({ success: true, message: "Notification marked as read", data: notification });
};

const markAllAsRead = async (req, res) => {
  const result = await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
  return res.json({ success: true, message: "All notifications marked as read", modifiedCount: result.modifiedCount });
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
