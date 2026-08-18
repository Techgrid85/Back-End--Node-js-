const express = require("express");

const Middleware = require("../Middleware/authMiddleware.js");
const staffController = require("../Controllers/staffController.js");
const staffMiddleware = require("../Middleware/staffMiddleware.js");

const staffRoutes = express.Router();

// ==========================================
// ALL STAFF ROUTES REQUIRE STAFF AUTH
// ==========================================
staffRoutes.use(
  Middleware.verifyToken,
  Middleware.authorizeRoles("staff")
);

// ==========================================
// STAFF DASHBOARD
// ==========================================
staffRoutes.get(
  "/",
  staffController.getStaffDashboard
);

// ==========================================
// COMPLAINTS
// ==========================================
staffRoutes.get(
  "/assigned",
  staffController.getAssignedComplaints
);

staffRoutes.get(
  "/assigned/:id",
  staffController.getAssignedComplaintById
);

staffRoutes.put(
  "/assigned/:id/status",
  staffController.updateComplaintStatus
);

staffRoutes.get(
  "/completed",
  staffController.getCompletedComplaints
);

staffRoutes.get(
  "/history",
  staffController.getComplaintHistory
);

// ==========================================
// STAFF PROFILE
// ==========================================
staffRoutes.get(
  "/profile",
  staffController.getStaffProfile
);

staffRoutes.put(
  "/profile",
  staffController.updateStaffProfile
);

staffRoutes.put(
  "/profile/picture",
  staffMiddleware.profilePictureUpload.single("profilePic"),
  staffController.updateStaffProfilePicture
);

module.exports = staffRoutes;
