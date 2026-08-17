const express = require("express");
const authController = require("../Controllers/authController.js");
const Middleware = require("../Middleware/authMiddleware.js");
const adminController = require("../Controllers/adminController.js");

const authrouter = express.Router();


authrouter.get(
  "/available-flats",
  adminController.getAvailableFlats
);


authrouter.post(
  "/register",
  Middleware.registerMiddleware,
  authController.Register
);


authrouter.post(
  "/login",
  Middleware.loginMiddleware,
  authController.Login
);


module.exports = authrouter;