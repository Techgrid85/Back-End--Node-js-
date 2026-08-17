const express = require("express");

const Middleware = require("../Middleware/authMiddleware.js");
const adminController = require("../Controllers/adminController.js");
const adminMiddleware = require("../Middleware/adminMiddleware.js");

const adminroutes = express.Router();



adminroutes.use(
  Middleware.verifyToken,
  Middleware.authorizeRoles("admin")
);


adminroutes.get(
  "/dashboard",
  adminController.getAdminDashboard
);



adminroutes.get(
  "/complaints",
  adminController.getAllComplaints
);


adminroutes.get(
  "/staff",
  adminController.getAllStaff
);



adminroutes.put(
  "/complaints/:complaintId/assign",
  adminMiddleware.validateAssignStaff,
  adminController.assignStaffToComplaint
);



adminroutes.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to SmartSociety Admin Dashboard",
    user: req.user,
  });
});


adminroutes.get(
  "/residents",
  adminController.getAllResidents
);



adminroutes.get(
  "/residents/:residentId",
  adminController.getResidentById
);

adminroutes.post(
  "/residents",
  adminMiddleware.validateCreateResident,
  adminController.createResident
);




adminroutes.put(
  "/residents/:residentId",
  adminMiddleware.validateUpdateResident,
  adminController.updateResident
);



adminroutes.patch(
  "/residents/:residentId/status",
  adminController.toggleResidentStatus
);




adminroutes.get(
  "/flats",
  adminController.getAllFlats
);



adminroutes.get(
  "/flats/:flatId",
  adminController.getFlatById
);


adminroutes.post(
  "/flats",
  adminMiddleware.validateCreateFlat,
  adminController.createFlat
);



adminroutes.put(
  "/flats/:flatId",
  adminMiddleware.validateUpdateFlat,
  adminController.updateFlat
);



adminroutes.delete(
  "/flats/:flatId",
  adminController.deleteFlat
);


adminroutes.get(
  "/bills",
  adminController.getAllMaintenance
);

adminroutes.get(
  "/bills/:maintenanceId",
  adminController.getMaintenanceById
);

adminroutes.post(
  "/bills",
  adminController.createMaintenance
);

adminroutes.put(
  "/bills/:maintenanceId",
  adminController.updateMaintenance
);

adminroutes.patch(
  "/bills/:maintenanceId/pay",
  adminController.markMaintenancePaid
);

adminroutes.delete(
  "/bills/:maintenanceId",
  adminController.deleteMaintenance
);



adminroutes.get(
  "/security",
  adminController.getSecurityOverview
);


adminroutes.get(
  "/security/active",
  adminController.getAdminActiveVisitors
);


adminroutes.get(
  "/security/entry-logs",
  adminController.getAdminEntryLogs
);


adminroutes.get(
  "/security/exit-logs",
  adminController.getAdminExitLogs
);

// Overstay visitors
adminroutes.get(
  "/security/overstay",
  adminController.getAdminOverstayVisitors
);

// Search visitors
adminroutes.get(
  "/security/search",
  adminController.searchAdminVisitors
);

// All security logs
adminroutes.get(
  "/security/logs",
  adminController.getAdminSecurityLogs
);




adminroutes.get(
  "/bookings",
  adminController.getAllBookings
);



adminroutes.get(
  "/bookings/:bookingId",
  adminController.getBookingById
);



adminroutes.patch(
  "/bookings/:bookingId/status",
  adminController.updateBookingStatus
);



adminroutes.delete(
  "/bookings/:bookingId",
  adminController.deleteBooking
);






adminroutes.get(
  "/notices",
  adminController.getAllNotices
);



adminroutes.get(
  "/notices/:noticeId",
  adminController.getNoticeById
);


// CREATE NOTICE
adminroutes.post(
  "/notices",
  adminController.createNotice
);


// UPDATE NOTICE
adminroutes.put(
  "/notices/:noticeId",
  adminController.updateNotice
);


// DELETE NOTICE
adminroutes.delete(
  "/notices/:noticeId",
  adminController.deleteNotice
);

// CREATE POLL
adminroutes.post(
  "/polls",
  adminController.createPoll
);


// GET ALL POLLS
adminroutes.get(
  "/polls",
  adminController.getAllPolls
);


// GET SINGLE POLL
adminroutes.get(
  "/polls/:pollId",
  adminController.getPollById
);


// UPDATE POLL
adminroutes.put(
  "/polls/:pollId",
  adminController.updatePoll
);


// UPDATE POLL STATUS
adminroutes.patch(
  "/polls/:pollId/status",
  adminController.updatePollStatus
);


// DELETE POLL
adminroutes.delete(
  "/polls/:pollId",
  adminController.deletePoll
);
// GET ALL GUARDS
adminroutes.get(
  "/guards",
  adminController.getAllGuards
);

// GET SINGLE GUARD
adminroutes.get(
  "/guards/:guardId",
  adminController.getGuardById
);

// CREATE GUARD
adminroutes.post(
  "/guards",
  adminController.createGuard
);

// UPDATE GUARD
adminroutes.put(
  "/guards/:guardId",
  adminController.updateGuard
);

// ACTIVATE / DEACTIVATE GUARD
adminroutes.patch(
  "/guards/:guardId/status",
  adminController.toggleGuardStatus
);


// GET ALL STAFF
adminroutes.get(
  "/staff",
  adminController.getAllAdminStaff
);


// GET SINGLE STAFF
adminroutes.get(
  "/staff/:staffId",
  adminController.getStaffById
);


// CREATE STAFF
adminroutes.post(
  "/staff",
  adminController.createStaff
);


// UPDATE STAFF
adminroutes.put(
  "/staff/:staffId",
  adminController.updateStaff
);


// ACTIVATE / DEACTIVATE STAFF
adminroutes.patch(
  "/staff/:staffId/status",
  adminController.toggleStaffStatus
);

adminroutes.get(
  "/complaints/completed",
  adminController.getCompletedComplaintsForAdmin
);



adminroutes.post(
  "/complaints/:complaintId/generate-bill",
  adminController.generateComplaintBill
);

adminroutes.get(
  "/bills/:maintenanceId/invoice",
  adminController.getMaintenanceInvoice
);

adminroutes.get(
  "/audit-logs",
  adminController.getAuditLogs
);
adminroutes.get(
  "/profile",
  adminController.getAdminProfile
);

adminroutes.put(
  "/profile",
  adminController.updateAdminProfile
);

module.exports = adminroutes;