const express = require("express");
const authController = require("../Controllers/authController.js");
const Middleware = require("../Middleware/authMiddleware.js");

const authrouter = express.Router();


authrouter.post(
  "/login",
  Middleware.loginMiddleware,
  authController.Login
);


module.exports = authrouter;
