const express = require("express");
const Middleware = require("../Middleware/authMiddleware.js");
const notificationController = require("../Controllers/notificationController.js");

const router = express.Router();
router.use(Middleware.verifyToken);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
