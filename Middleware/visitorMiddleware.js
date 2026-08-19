const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidName = (value) => /^[a-zA-Z\s.'-]+$/.test(value);

const fail = (res, field, message) =>
  res.status(400).json({ success: false, field, message });

const validateRegistration = (req, res, next) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  const { password } = req.body;

  if (!name || name.length < 3 || name.length > 50 || !isValidName(name)) {
    return fail(res, "name", "Enter a valid name between 3 and 50 characters");
  }
  if (!email || !isValidEmail(email)) return fail(res, "email", "Please enter a valid email address");
  if (!/^\d{10}$/.test(phone)) return fail(res, "phone", "Phone number must be exactly 10 digits");
  if (typeof password !== "string" || password.length < 8 || password.length > 100 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return fail(res, "password", "Password must be 8+ characters and include upper, lower, and a number");
  }

  req.body.name = name;
  req.body.email = email;
  req.body.phone = phone;
  next();
};

const validateProfileUpdate = (req, res, next) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

  if (!name || name.length < 3 || name.length > 50 || !isValidName(name)) {
    return fail(res, "name", "Enter a valid name between 3 and 50 characters");
  }
  if (!/^\d{10}$/.test(phone)) return fail(res, "phone", "Phone number must be exactly 10 digits");

  req.body.name = name;
  req.body.phone = phone;
  next();
};

const validateVisitRequest = (req, res, next) => {
  const { residentId, visitDate, visitStartTime, visitEndTime } = req.body;
  const purpose = typeof req.body.purpose === "string" ? req.body.purpose.trim() : "";
  const visitorType = typeof req.body.visitorType === "string" ? req.body.visitorType.trim() : "Guest";
  const vehicleNumber = typeof req.body.vehicleNumber === "string" ? req.body.vehicleNumber.trim().toUpperCase() : "";
  const allowedTypes = ["Guest", "Delivery", "Cab", "Vendor"];
  const date = new Date(visitDate);
  const start = new Date(visitStartTime);
  const end = new Date(visitEndTime);

  if (!residentId) return fail(res, "residentId", "Please select a resident");
  if (!purpose || purpose.length < 3 || purpose.length > 200) return fail(res, "purpose", "Purpose must be between 3 and 200 characters");
  if (!allowedTypes.includes(visitorType)) return fail(res, "visitorType", "Please select a valid visitor type");
  if ([date, start, end].some((value) => Number.isNaN(value.getTime()))) return fail(res, "visitDate", "Please provide a valid visit date and time");
  if (start <= new Date() || end <= start) return fail(res, "visitStartTime", "Choose a future end time after the start time");

  req.body.purpose = purpose;
  req.body.visitorType = visitorType;
  req.body.vehicleNumber = vehicleNumber;
  req.body.visitDate = date;
  req.body.visitStartTime = start;
  req.body.visitEndTime = end;
  next();
};

module.exports = { validateRegistration, validateProfileUpdate, validateVisitRequest };
