const mongoose = require("mongoose");


const validateCreateResident = (req, res, next) => {
  const { name, email, password, phone, flatNo } = req.body;

  if (!name || !email || !password || !phone || !flatNo) {
    return res.status(400).json({
      success: false,
      message:
        "Name, email, password, phone and flat number are required",
    });
  }

  if (typeof name !== "string" || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Name must be at least 3 characters long",
    });
  }

  if (name.trim().length > 50) {
    return res.status(400).json({
      success: false,
      message: "Name cannot exceed 50 characters",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    typeof email !== "string" ||
    !emailRegex.test(email.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address",
    });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  if (
    typeof phone !== "string" ||
    !/^\d{10}$/.test(phone.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "Phone number must contain exactly 10 digits",
    });
  }

  if (
    typeof flatNo !== "string" ||
    flatNo.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid flat number",
    });
  }

  next();
};


const validateUpdateResident = (req, res, next) => {
  const { name, email, phone, flatNo, isActive } = req.body;

  
  if (
    name === undefined &&
    email === undefined &&
    phone === undefined &&
    flatNo === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least one field to update",
    });
  }

  if (name !== undefined) {
    if (
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 3 and 50 characters",
      });
    }
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      typeof email !== "string" ||
      !emailRegex.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }
  }

  if (phone !== undefined) {
    if (
      typeof phone !== "string" ||
      !/^\d{10}$/.test(phone.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain exactly 10 digits",
      });
    }
  }

  if (flatNo !== undefined) {
    if (
      typeof flatNo !== "string" ||
      flatNo.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid flat number",
      });
    }
  }

  if (
    isActive !== undefined &&
    typeof isActive !== "boolean"
  ) {
    return res.status(400).json({
      success: false,
      message: "isActive must be true or false",
    });
  }

  next();
};



const validateCreateFlat = (req, res, next) => {
  const { flatNo, block, floor, type, status } = req.body;

  if (
    !flatNo ||
    !block ||
    floor === undefined ||
    !type
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Flat number, block, floor and type are required",
    });
  }

  if (
    typeof flatNo !== "string" ||
    flatNo.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid flat number",
    });
  }

  if (
    typeof block !== "string" ||
    block.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid block",
    });
  }

  if (
    !Number.isInteger(Number(floor)) ||
    Number(floor) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Floor must be a whole number greater than or equal to 0",
    });
  }

  const allowedTypes = [
    "1BHK",
    "2BHK",
    "3BHK",
    "4BHK",
    "Other",
  ];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid flat type",
    });
  }

  const allowedStatuses = [
    "Occupied",
    "Vacant",
    "Maintenance",
  ];

  if (
    status !== undefined &&
    !allowedStatuses.includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid flat status",
    });
  }

  next();
};



const validateUpdateFlat = (req, res, next) => {
  const { flatNo, block, floor, type, status } = req.body;

  if (
    flatNo === undefined &&
    block === undefined &&
    floor === undefined &&
    type === undefined &&
    status === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least one field to update",
    });
  }

  if (flatNo !== undefined) {
    if (
      typeof flatNo !== "string" ||
      flatNo.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid flat number",
      });
    }
  }

  if (block !== undefined) {
    if (
      typeof block !== "string" ||
      block.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid block",
      });
    }
  }

  if (floor !== undefined) {
    if (
      !Number.isInteger(Number(floor)) ||
      Number(floor) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Floor must be a whole number greater than or equal to 0",
      });
    }
  }

  const allowedTypes = [
    "1BHK",
    "2BHK",
    "3BHK",
    "4BHK",
    "Other",
  ];

  if (
    type !== undefined &&
    !allowedTypes.includes(type)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid flat type",
    });
  }

  const allowedStatuses = [
    "Occupied",
    "Vacant",
    "Maintenance",
  ];

  if (
    status !== undefined &&
    !allowedStatuses.includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid flat status",
    });
  }

  next();
};



const validateAssignStaff = (req, res, next) => {
  const { complaintId } = req.params;
  const { staffId, adminRemark } = req.body;

  if (!mongoose.Types.ObjectId.isValid(complaintId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid complaint ID",
    });
  }

  if (!staffId) {
    return res.status(400).json({
      success: false,
      message: "Staff ID is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid staff ID",
    });
  }

  if (
    adminRemark !== undefined &&
    typeof adminRemark !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Admin remark must be text",
    });
  }

  next();
};


module.exports = {
  validateCreateResident,
  validateUpdateResident,
  validateCreateFlat,
  validateUpdateFlat,
  validateAssignStaff,
};