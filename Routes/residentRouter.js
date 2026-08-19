const express = require("express");

const Middleware = require("../Middleware/authMiddleware.js");
const residentController = require("../Controllers/residentController.js");
const residentMiddleware = require("../Middleware/residentMiddleware.js");

const residentroutes = express.Router();



residentroutes.use(
  Middleware.verifyToken,
  Middleware.authorizeRoles("resident")
);

residentroutes.get(
  "/",
  residentController.getResidentDashboard
);



residentroutes.get(
  "/profile",
  residentController.getResidentProfile
);


residentroutes.put(
  "/profile",
  residentMiddleware.validateProfileUpdate,
  residentController.updateResidentProfile
);

residentroutes.put(
  "/profile-picture",
  residentMiddleware.uploadProfilePicture.single(
    "profilePic"
  ),
  residentController.updateResidentProfilePicture
);

residentroutes.get("/visitor-settings", residentController.getVisitorSettings);
residentroutes.put("/visitor-settings", residentMiddleware.validateVisitorSettings, residentController.updateVisitorSettings);
residentroutes.get("/visitor-requests", residentController.getIncomingVisitorRequests);
residentroutes.patch("/visitor-requests/:id", residentController.respondToVisitorRequest);
residentroutes.patch("/visitor-passes/:id/revoke", residentController.revokeVisitorPass);


residentroutes.post(
  "/complaints",
  residentMiddleware.uploadComplaintPhoto.single("photo"),
  residentMiddleware.validateComplaint,
  residentController.createComplaint
);


residentroutes.get(
  "/complaints",
  residentController.getMyComplaints
);


residentroutes.get(
  "/complaints/:id",
  residentController.getComplaintById
);


residentroutes.post(
  "/visitors",
  residentMiddleware.validateVisitor,
  residentController.createVisitor
);


residentroutes.get(
  "/visitors",
  residentController.getMyVisitors
);


residentroutes.get(
  "/visitors/:id",
  residentController.getVisitorById
);


residentroutes.get(
  "/maintenance",
  residentController.getMyMaintenance
);


residentroutes.get(
  "/maintenance/:id",
  residentController.getMaintenanceById
);



residentroutes.get(
  "/notices",
  residentController.getNotices
);


residentroutes.get(
  "/notices/:id",
  residentController.getNoticeById
);


residentroutes.get(
  "/events",
  residentController.getEvents
);


residentroutes.get(
  "/events/:id",
  residentController.getEventById
);



residentroutes.post(
  "/bookings",
  residentMiddleware.validateBooking,
  residentController.createBooking
);

residentroutes.get(
  "/bookings",
  residentController.getMyBookings
);

residentroutes.get(
  "/bookings/:id",
  residentController.getBookingById
);


residentroutes.get(
  "/polls",
  residentController.getPolls
);

residentroutes.get(
  "/polls/:id",
  residentController.getPollById
);

residentroutes.post(
  "/polls/:id/vote",
  residentController.voteOnPoll
);


module.exports = residentroutes;
