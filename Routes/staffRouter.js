const express = require("express");

const Middleware = require("../Middleware/authMiddleware.js");
const staffController = require("../Controllers/staffController.js");

const staffRoutes = express.Router();


staffRoutes.use(
  Middleware.verifyToken,
  Middleware.authorizeRoles("staff")
);

staffRoutes.get(
  "/",
  staffController.getStaffDashboard
);


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
staffRoutes.get(
  "/profile",
  staffController.getStaffProfile
);

staffRoutes.put(
  "/profile",
  staffController.updateStaffProfile
);

module.exports = staffRoutes;