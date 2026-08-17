const jwt = require("jsonwebtoken");

const registerMiddleware = (req, res, next) => {
  let { name, email, flatNo, phone, password } = req.body;

  name = typeof name === "string" ? name.trim() : "";
  email =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";
  flatNo =
    typeof flatNo === "string"
      ? flatNo.trim()
      : "";
  phone =
    typeof phone === "string"
      ? phone.trim()
      : "";


  if (!name) {
    return res.status(400).json({
      success: false,
      field: "name",
      message: "Name is required",
    });
  }

  if (name.length < 3) {
    return res.status(400).json({
      success: false,
      field: "name",
      message: "Name must be at least 3 characters",
    });
  }

  if (name.length > 50) {
    return res.status(400).json({
      success: false,
      field: "name",
      message: "Name cannot exceed 50 characters",
    });
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    return res.status(400).json({
      success: false,
      field: "name",
      message: "Name contains invalid characters",
    });
  }


  
  if (!email) {
    return res.status(400).json({
      success: false,
      field: "email",
      message: "Email is required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      field: "email",
      message: "Please enter a valid email address",
    });
  }

  
if (!flatNo) {
  return res.status(400).json({
    success: false,
    field: "flatNo",
    message: "Please select your flat number",
  });
}


  if (!phone) {
    return res.status(400).json({
      success: false,
      field: "phone",
      message: "Phone number is required",
    });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      field: "phone",
      message: "Phone number must be exactly 10 digits",
    });
  }

  
  if (!password) {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Password is required",
    });
  }

  if (typeof password !== "string") {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Invalid password",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Password must be at least 8 characters",
    });
  }

  if (password.length > 100) {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Password is too long",
    });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Password must contain an uppercase letter",
    });
  }

  if (!/[a-z]/.test(password)) {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Password must contain a lowercase letter",
    });
  }

  if (!/\d/.test(password)) {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Password must contain a number",
    });
  }

  
  req.body.name = name;
  req.body.email = email;
  req.body.flatNo = flatNo;
  req.body.phone = phone;

  next();
};



const loginMiddleware = (req, res, next) => {
  let { email, password } = req.body;

  email =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  if (!email) {
    return res.status(400).json({
      success: false,
      field: "email",
      message: "Email is required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      field: "email",
      message: "Please enter a valid email address",
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Password is required",
    });
  }

  if (typeof password !== "string") {
    return res.status(400).json({
      success: false,
      field: "password",
      message: "Invalid password",
    });
  }

  req.body.email = email;

  next();
};



const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token not provided",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.MY_KEY
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};



const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log("DECODED USER:", req.user);
    console.log("ALLOWED ROLES:", roles);
    console.log("USER ROLE:", req.user?.role);

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this route",
      });
    }

    next();
  };
};


module.exports = {
  registerMiddleware,
  loginMiddleware,
  verifyToken,
  authorizeRoles,
};