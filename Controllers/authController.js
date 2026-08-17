const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Auth = require("../Models/authModel.js");
const Flat = require("../Models/flatModel.js");


const Register = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      name,
      email,
      password,
      phone,
      flatNo,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFlatNo = flatNo.trim().toUpperCase();

    session.startTransaction();

    const existingUser = await Auth.findOne({
      email: normalizedEmail,
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        field: "email",
        message: "This email is already in use",
      });
    }

    const flat = await Flat.findOne({
      flatNo: normalizedFlatNo,
    }).session(session);

    if (!flat) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        field: "flatNo",
        message: "Selected flat does not exist",
      });
    }

    if (
      flat.status !== "Vacant" ||
      flat.resident
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        field: "flatNo",
        message: "This flat is no longer available",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = new Auth({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "resident",
      phone: phone.trim(),
      flatNo: normalizedFlatNo,
      isActive: true,
    });

    await account.save({ session });

    flat.resident = account._id;
    flat.status = "Occupied";

    await flat.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Account created and flat assigned successfully",

      data: {
        userId: account._id,
        name: account.name,
        email: account.email,
        role: account.role,
        phone: account.phone,
        flatNo: account.flatNo,
      },
    });

  } catch (error) {
    await session.abortTransaction();

    console.error("Register Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        field: "email",
        message: "This email is already in use",
      });
    }

    if (error.name === "ValidationError") {
      const firstField = Object.keys(error.errors)[0];

      return res.status(400).json({
        success: false,
        field: firstField,
        message: error.errors[firstField].message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account. Please try again",
    });

  } finally {
    await session.endSession();
  }
};


const Login = async (req, res) => {
  try {
    console.log("Login request received");

    const { email, password } = req.body;

    console.log("Email:", email);

    const user = await Auth.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      console.log("User not found");

      return res.status(401).json({
        success: false,
        field: "email",
        message: "User not found",
      });
    }

    console.log("User found:", user.email);

    const matchPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!matchPassword) {
      console.log("Password does not match");

      return res.status(401).json({
        success: false,
        field: "password",
        message: "Password does not match",
      });
    }

    console.log("Password matched");

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    if (!process.env.MY_KEY) {
      console.log("MY_KEY is missing");

      return res.status(500).json({
        success: false,
        message: "JWT secret is not configured",
      });
    }

    console.log("Creating token...");

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.MY_KEY,
      {
        expiresIn: "7d",
      }
    );

    console.log("Token created successfully");
    console.log("Sending login response");

    return res.status(200).json({
      success: true,
      message: `Welcome ${user.name}`,
      token,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      flatNo: user.flatNo,
      phone: user.phone,
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

module.exports = {
  Register,
  Login,
};