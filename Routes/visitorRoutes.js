const express = require("express");
const Middleware = require("../Middleware/authMiddleware.js");
const visitorMiddleware = require("../Middleware/visitorMiddleware.js");
const visitorController = require("../Controllers/visitorController.js");

const visitorRoutes = express.Router();

// Public route: the controller checks the administrator's registration setting.
visitorRoutes.post("/register", visitorMiddleware.validateRegistration, visitorController.registerVisitor);

visitorRoutes.use(Middleware.verifyToken, Middleware.authorizeRoles("visitor"));

visitorRoutes.get("/profile", visitorController.getProfile);
visitorRoutes.put("/profile", visitorMiddleware.validateProfileUpdate, visitorController.updateProfile);
visitorRoutes.delete("/profile", visitorController.deactivateProfile);
visitorRoutes.get("/residents", visitorController.findResident);
visitorRoutes.get("/map", visitorController.getPublicMap);
visitorRoutes.post("/requests", visitorMiddleware.validateVisitRequest, visitorController.createVisitRequest);
visitorRoutes.get("/requests", visitorController.getMyRequests);
visitorRoutes.get("/passes", visitorController.getMyPasses);

module.exports = visitorRoutes;
