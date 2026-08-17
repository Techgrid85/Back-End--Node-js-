

const validateWalkInVisitor = (req, res, next) => {
  const {
    resident,
    flatNo,
    visitorName,
    phone,
    purpose,
  } = req.body;

  
  
  if (
    !resident ||
    !flatNo ||
    !visitorName ||
    !phone ||
    !purpose
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Resident, flat number, visitor name, phone and purpose are required",
    });
  }

 
  
  if (
    typeof visitorName !== "string" ||
    visitorName.trim().length < 3 ||
    visitorName.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Visitor name must be between 3 and 100 characters",
    });
  }

  
  
  
  if (
    typeof phone !== "string" ||
    !/^\d{10}$/.test(phone)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Phone number must contain exactly 10 digits",
    });
  }

  
  if (
    typeof flatNo !== "string" ||
    flatNo.trim().length < 1 ||
    flatNo.trim().length > 30
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Flat number must be between 1 and 30 characters",
    });
  }

  
  
  
  if (
    typeof purpose !== "string" ||
    purpose.trim().length < 3 ||
    purpose.trim().length > 200
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Purpose must be between 3 and 200 characters",
    });
  }

  next();
};


const validateVisitorSearch = (req, res, next) => {
  const { search } = req.query;

  if (
    search !== undefined &&
    typeof search !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Search value must be a valid string",
    });
  }

  if (
    typeof search === "string" &&
    search.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Search value cannot exceed 100 characters",
    });
  }

  next();
};



const validateVisitorId = (req, res, next) => {
  const { id, visitorId } = req.params;

  const value = id || visitorId;

  if (!value) {
    return res.status(400).json({
      success: false,
      message: "Visitor ID is required",
    });
  }

  if (!/^[a-fA-F0-9]{24}$/.test(value)) {
    return res.status(400).json({
      success: false,
      message: "Invalid visitor ID",
    });
  }

  next();
};

module.exports = {
  validateWalkInVisitor,
  validateVisitorSearch,
  validateVisitorId,
};