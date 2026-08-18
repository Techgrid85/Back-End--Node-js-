const multer = require("multer");

const storage = multer.memoryStorage();

const uploadProfilePicture = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, PNG and WEBP images are allowed"
        )
      );
    }
  },
});


const VALID_CATEGORIES = [
  "Maintenance",
  "Security",
  "Cleanliness",
  "Noise",
  "Parking",
  "Other",
];



const validateComplaint = (req, res, next) => {
  let { subject, description, category } = req.body;

  subject =
    typeof subject === "string" ? subject.trim() : "";

  description =
    typeof description === "string"
      ? description.trim()
      : "";

  category =
    typeof category === "string"
      ? category.trim()
      : "";

      
  if (!subject || !description || !category) {
    return res.status(400).json({
      success: false,
      message: "Subject, description and category are required",
    });
  }

  
  if (subject.length < 3 || subject.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Subject must be between 3 and 100 characters",
    });
  }

  
  if (description.length < 10 || description.length > 1000) {
    return res.status(400).json({
      success: false,
      message:
        "Description must be between 10 and 1000 characters",
    });
  }

  
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid complaint category",
    });
  }

  
  req.body.subject = subject;
  req.body.description = description;
  req.body.category = category;

  next();
};




const validateVisitor = (req, res, next) => {
  let {
    visitorName,
    phone,
    purpose,
    visitDate,
  } = req.body;

  visitorName =
    typeof visitorName === "string"
      ? visitorName.trim()
      : "";

  phone =
    typeof phone === "string"
      ? phone.trim()
      : "";

  purpose =
    typeof purpose === "string"
      ? purpose.trim()
      : "";

      
  if (
    !visitorName ||
    !phone ||
    !purpose ||
    !visitDate
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all visitor details",
    });
  }

  
  if (
    visitorName.length < 3 ||
    visitorName.length > 100
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Visitor name must be between 3 and 100 characters",
    });
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(visitorName)) {
    return res.status(400).json({
      success: false,
      message: "Visitor name contains invalid characters",
    });
  }

  // Phone
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message:
        "Visitor phone number must be exactly 10 digits",
    });
  }

  // Purpose
  if (
    purpose.length < 3 ||
    purpose.length > 200
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Purpose must be between 3 and 200 characters",
    });
  }

  // Date
  const parsedDate = new Date(visitDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid visit date",
    });
  }

  // Clean values
  req.body.visitorName = visitorName;
req.body.phone = phone;
req.body.purpose = purpose;
req.body.visitDate = parsedDate;


  next();
};



const validateProfileUpdate = (req, res, next) => {
  let {
    name,
    phone,
    vehicleRegistration,
    emergencyContactName,
    emergencyContactRelationship,
    familyDetails,
  } = req.body;

  name =
    typeof name === "string"
      ? name.trim()
      : "";

  phone =
    typeof phone === "string"
      ? phone.trim()
      : "";

  vehicleRegistration =
    typeof vehicleRegistration === "string"
      ? vehicleRegistration.trim()
      : "";

  emergencyContactName =
    typeof emergencyContactName === "string"
      ? emergencyContactName.trim()
      : "";

  emergencyContactRelationship =
    typeof emergencyContactRelationship === "string"
      ? emergencyContactRelationship.trim()
      : "";

  familyDetails =
    typeof familyDetails === "string"
      ? familyDetails.trim()
      : "";

  // ==========================================
  // REQUIRED PERSONAL INFORMATION
  // ==========================================

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: "Name and phone are required",
    });
  }

  // ==========================================
  // NAME
  // ==========================================

  if (name.length < 3 || name.length > 50) {
    return res.status(400).json({
      success: false,
      message: "Name must be between 3 and 50 characters",
    });
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    return res.status(400).json({
      success: false,
      message: "Name contains invalid characters",
    });
  }

  // ==========================================
  // PHONE
  // ==========================================

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Phone number must be exactly 10 digits",
    });
  }

  // ==========================================
  // VEHICLE
  // ==========================================

  if (vehicleRegistration.length > 30) {
    return res.status(400).json({
      success: false,
      message:
        "Vehicle registration must not exceed 30 characters",
    });
  }

  // ==========================================
  // EMERGENCY CONTACT NAME
  // ==========================================

  if (emergencyContactName) {
    if (
      emergencyContactName.length < 3 ||
      emergencyContactName.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Emergency contact name must be between 3 and 50 characters",
      });
    }

    if (!/^[a-zA-Z\s.'-]+$/.test(emergencyContactName)) {
      return res.status(400).json({
        success: false,
        message:
          "Emergency contact name contains invalid characters",
      });
    }
  }

  // ==========================================
  // EMERGENCY RELATIONSHIP
  // ==========================================

  if (emergencyContactRelationship.length > 50) {
    return res.status(400).json({
      success: false,
      message:
        "Emergency contact relationship must not exceed 50 characters",
    });
  }

  // ==========================================
  // FAMILY DETAILS
  // ==========================================

  if (familyDetails.length > 500) {
    return res.status(400).json({
      success: false,
      message:
        "Family details must not exceed 500 characters",
    });
  }

  // ==========================================
  // CLEAN DATA
  // ==========================================

  req.body.name = name;
  req.body.phone = phone;
  req.body.vehicleRegistration = vehicleRegistration;
  req.body.emergencyContactName = emergencyContactName;
  req.body.emergencyContactRelationship =
    emergencyContactRelationship;
  req.body.familyDetails = familyDetails;

  next();
};

const validateBooking = (req, res, next) => {
  let {
    facility,
    bookingDate,
    startTime,
    endTime,
    purpose,
  } = req.body;

  facility =
    typeof facility === "string"
      ? facility.trim()
      : "";

  bookingDate =
    typeof bookingDate === "string"
      ? bookingDate.trim()
      : "";

  startTime =
    typeof startTime === "string"
      ? startTime.trim()
      : "";

  endTime =
    typeof endTime === "string"
      ? endTime.trim()
      : "";

  purpose =
    typeof purpose === "string"
      ? purpose.trim()
      : "";

  // Required fields
  if (
    !facility ||
    !bookingDate ||
    !startTime ||
    !endTime ||
    !purpose
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Facility, date, start time, end time and purpose are required",
    });
  }

  // Allowed facilities
  const VALID_FACILITIES = [
    "Community Hall",
    "Swimming Pool",
    "Gym",
    "Tennis Court",
    "Party Area",
    "Other",
  ];

  if (!VALID_FACILITIES.includes(facility)) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid facility",
    });
  }

  // Purpose validation
  if (purpose.length < 3 || purpose.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Purpose must be between 3 and 500 characters",
    });
  }

  // Date validation
  const parsedDate = new Date(bookingDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid booking date",
    });
  }

  // Remove time from date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  parsedDate.setHours(0, 0, 0, 0);

  if (parsedDate < today) {
    return res.status(400).json({
      success: false,
      message: "Booking date cannot be in the past",
    });
  }

  // Time format: HH:mm
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timeRegex.test(startTime)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid start time",
    });
  }

  if (!timeRegex.test(endTime)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid end time",
    });
  }

  // Convert time to minutes
  const [startHour, startMinute] =
    startTime.split(":").map(Number);

  const [endHour, endMinute] =
    endTime.split(":").map(Number);

  const startMinutes =
    startHour * 60 + startMinute;

  const endMinutes =
    endHour * 60 + endMinute;

  if (endMinutes <= startMinutes) {
    return res.status(400).json({
      success: false,
      message: "End time must be later than start time",
    });
  }

  // Save cleaned values
  req.body.facility = facility;
  req.body.bookingDate = parsedDate;
  req.body.startTime = startTime;
  req.body.endTime = endTime;
  req.body.purpose = purpose;

  next();
};


const validatePollVote = (req, res, next) => {
  const { optionId } = req.body;

  if (!optionId) {
    return res.status(400).json({
      success: false,
      message: "Please select an option",
    });
  }

  if (
    typeof optionId !== "string" ||
    optionId.trim() === ""
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid option",
    });
  }

  req.body.optionId = optionId.trim();

  next();
};
const uploadComplaintPhoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, PNG and WEBP images are allowed"
        )
      );
    }
  },
});

module.exports = {
  validateComplaint,
  validateVisitor,
  validateProfileUpdate,
  validateBooking,
  validatePollVote,
  uploadProfilePicture,
  uploadComplaintPhoto,
};
