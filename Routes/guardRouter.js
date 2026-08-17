const express = require("express");

const Middleware = require("../Middleware/authMiddleware.js");
const guardController = require("../Controllers/guardController.js");
const guardMiddleware = require("../Middleware/guardMiddleware.js");

const guardroutes = express.Router();

guardroutes.use(
  Middleware.verifyToken,
  Middleware.authorizeRoles("guard")
);

guardroutes.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to SmartSociety Security Dashboard",
      user: req.user,
    });
  }
);

guardroutes.get(
  "/verify-pass/:gateKey",
  guardMiddleware.validateGateKey,
  guardController.verifyGatePass
);

guardroutes.put(
  "/approve-pass/:visitorId",
  guardMiddleware.validateVisitorId,
  guardController.approveVisitorPass
);

guardroutes.post(
  "/walk-in",
  guardMiddleware.validateWalkInVisitor,
  guardController.createWalkInVisitor
);

guardroutes.get(
  "/search",
  guardMiddleware.validateVisitorSearch,
  guardController.searchVisitors
);

guardroutes.put(
  "/visitors/:id/entry",
  guardMiddleware.validateVisitorId,
  guardController.markVisitorEntry
);

guardroutes.put(
  "/visitors/:id/exit",
  guardMiddleware.validateVisitorId,
  guardController.markVisitorExit
);

guardroutes.get(
  "/active-visitors",
  guardController.getActiveVisitors
);

guardroutes.get(
  "/entry-logs",
  guardController.getEntryLogs
);

guardroutes.get(
  "/exit-logs",
  guardController.getExitLogs
);

guardroutes.get(
  "/overstay-alerts",
  guardController.getOverstayAlerts
);

guardroutes.get(
  "/waiting-visitors",
  guardController.getWaitingVisitors
);

guardroutes.get(
  "/visitor-passes",
  guardController.getApprovedVisitorPasses
);
guardroutes.get(
  "/pending-visitors",
  guardController.getPendingVisitorPasses
);
guardroutes.get(
  "/residents",
  guardController.getResidents
);


guardroutes.get(
  "/profile",
  guardController.getGuardProfile
);

guardroutes.put(
  "/profile",
  guardController.updateGuardProfile
);



module.exports = guardroutes;
