const Auth = require("../Models/authModel.js");
const Complaint = require("../Models/complaintModel.js");
const Visitor = require("../Models/visitorModel.js");
const Maintenance = require("../Models/maintenanceModel.js");
const Notice = require("../Models/noticeModel.js");
const Event = require("../Models/eventModel.js");
const Booking = require("../Models/bookingModel.js");
const Poll = require("../Models/pollModel.js");
const PollVote = require("../Models/pollVoteModel.js");
const cloudinary = require("../config/cloudinary.js");

const getResidentDashboard = async (req, res) => {
  try {
    const residentId = req.user.id;

    const resident = await Auth.findById(residentId).select(
      "-password"
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    const [
      complaints,
      pendingComplaints,
      pendingMaintenance,
      recentNotices,
      upcomingEvents,
      recentVisitors,
    ] = await Promise.all([
      Complaint.countDocuments({ resident: residentId }),

      Complaint.countDocuments({
        resident: residentId,
        status: { $in: ["Pending", "In Progress"] },
      }),

      Maintenance.countDocuments({
        resident: residentId,
        status: { $in: ["Pending", "Overdue"] },
      }),

      Notice.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title description priority createdAt"),

      Event.find({
        eventDate: { $gte: new Date() },
      })
        .sort({ eventDate: 1 })
        .limit(5)
        .select("title description eventDate location"),

      Visitor.find({
        resident: residentId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("visitorName purpose visitDate status"),
    ]);

    return res.status(200).json({
      success: true,
      message: "Resident dashboard data fetched successfully",

      data: {
        resident: {
          _id: resident._id,
          name: resident.name,
          email: resident.email,
          phone: resident.phone,
          flatNo: resident.flatNo,
          profilePic: resident.profilePic,
        },

        stats: {
          totalComplaints: complaints,
          pendingComplaints,
          pendingMaintenance,
        },

        recentNotices,
        upcomingEvents,
        recentVisitors,
      },
    });

  } catch (error) {
    console.error("Resident Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};


const getResidentProfile = async (req, res) => {
  try {
    const resident = await Auth.findById(req.user.id).select(
      "-password"
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        _id: resident._id,
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        flatNo: resident.flatNo,
        profilePic: resident.profilePic,

        // OTHER INFORMATION
        vehicleRegistration:
          resident.vehicleRegistration || "",

        emergencyContact: {
          name: resident.emergencyContact?.name || "",
          phone: resident.emergencyContact?.phone || "",
          relationship:
            resident.emergencyContact?.relationship || "",
        },

        familyDetails:
          resident.familyDetails || "",
      },
    });

  } catch (error) {
    console.error("Get Resident Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch resident profile",
    });
  }
};




const updateResidentProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      vehicleRegistration,
      emergencyContact,
      familyDetails,
      tenantDetails,
    } = req.body;

    const resident = await Auth.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    // ==========================================
    // PERSONAL INFORMATION
    // ==========================================

    if (name !== undefined) {
      resident.name = name.trim();
    }

    if (phone !== undefined) {
      resident.phone = phone.trim();
    }

    // ==========================================
    // OTHER INFORMATION
    // ==========================================

    if (vehicleRegistration !== undefined) {
      resident.vehicleRegistration =
        vehicleRegistration.trim();
    }

    if (familyDetails !== undefined) {
      resident.familyDetails =
        familyDetails.trim();
    }

    if (tenantDetails !== undefined) {
      resident.tenantDetails =
        tenantDetails.trim();
    }

    // ==========================================
    // EMERGENCY CONTACT
    // ==========================================

    if (emergencyContact !== undefined) {
      resident.emergencyContact = {
        name:
          emergencyContact.name?.trim() || "",

        relationship:
          emergencyContact.relationship?.trim() || "",

        phone:
          emergencyContact.phone?.trim() || "",
      };
    }

    await resident.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",

      data: {
        _id: resident._id,
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        flatNo: resident.flatNo,
        role: resident.role,
        profilePic: resident.profilePic,

        vehicleRegistration:
          resident.vehicleRegistration,

        emergencyContact:
          resident.emergencyContact,

        familyDetails:
          resident.familyDetails,

        tenantDetails:
          resident.tenantDetails,
      },
    });

  } catch (error) {
    console.error(
      "Update Resident Profile Error:",
      error
    );

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

const updateResidentProfilePicture = async (req, res) => {
  try {
    const resident = await Auth.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    // ==========================================
    // CHECK FILE
    // ==========================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile picture",
      });
    }

    // ==========================================
    // UPLOAD TO CLOUDINARY
    // ==========================================

    const uploadResult = await new Promise(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "smart-society/profile-pictures",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(req.file.buffer);
      }
    );

    // ==========================================
    // SAVE IMAGE URL
    // ==========================================

    resident.profilePic = uploadResult.secure_url;

    await resident.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",

      data: {
        _id: resident._id,
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        flatNo: resident.flatNo,
        profilePic: resident.profilePic,
      },
    });

  } catch (error) {
    console.error(
      "Update Resident Profile Picture Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
    });
  }
};


const createComplaint = async (req, res) => {
  try {
    const resident = await Auth.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    const {
      subject,
      description,
      category,
    } = req.body;

    const complaint = await Complaint.create({
      resident: resident._id,
      flatNo: resident.flatNo,
      subject,
      description,
      category,
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: complaint,
    });

  } catch (error) {
    console.error("Create Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit complaint",
    });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      resident: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });

  } catch (error) {
    console.error("Get Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      resident: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint",
    });
  }
};

const createVisitor = async (req, res) => {
  try {
    const {
      visitorName,
      email,
      phone,
      visitorType,
      vehicleNumber,
      purpose,
      visitDate,
      visitStartTime,
      visitEndTime,
    } = req.body;

    // ==========================================
    // GET LOGGED-IN RESIDENT
    // ==========================================

    const resident = await Auth.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    // ==========================================
    // GENERATE UNIQUE 6-DIGIT GATE KEY
    // ==========================================

    let gateKey;
    let existingVisitor;

    do {
      gateKey = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      existingVisitor = await Visitor.findOne({
        gateKey,
      });

    } while (existingVisitor);

    // ==========================================
    // CREATE VISITOR PASS
    // ==========================================

    const visitor = await Visitor.create({
      resident: resident._id,
      flatNo: resident.flatNo,

      visitorName: visitorName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),

      visitorType: visitorType || "Guest",

      vehicleNumber: vehicleNumber
        ? vehicleNumber.trim().toUpperCase()
        : "",

      purpose: purpose.trim(),

      gateKey,

      visitDate: new Date(visitDate),
      visitStartTime: new Date(visitStartTime),
      visitEndTime: new Date(visitEndTime),

      status: "Pending",
      gateStatus: "Not Entered",

      isWalkIn: false,
    });

    return res.status(201).json({
      success: true,
      message:
        "Visitor pass created successfully and sent for approval",
      data: visitor,
    });

  } catch (error) {
    console.error("Create Visitor Error:", error);

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
      message:
        error.message || "Failed to create visitor pass",
    });
  }
};
const getMyVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      resident: req.user.id,
    })
      .sort({
        visitStartTime: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });

  } catch (error) {
    console.error("Get Visitors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch visitors",
    });
  }
};



const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({
      _id: req.params.id,
      resident: req.user.id,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: visitor,
    });

  } catch (error) {
    console.error("Get Single Visitor Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch visitor",
    });
  }
};



const getMyMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.find({
      resident: req.user.id,
    }).sort({
      dueDate: -1,
    });

    return res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance,
    });

  } catch (error) {
    console.error("Get Maintenance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance records",
    });
  }
};



const getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await Maintenance.findOne({
      _id: req.params.id,
      resident: req.user.id,
    });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: maintenance,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance record",
    });
  }
};



const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    return res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });

  } catch (error) {
    console.error("Get Notices Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notices",
    });
  }
};



const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(
      req.params.id
    ).populate("createdBy", "name role");

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: notice,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notice",
    });
  }
};



const getEvents = async (req, res) => {
  try {
    const events = await Event.find({
      eventDate: {
        $gte: new Date(),
      },
    })
      .sort({ eventDate: 1 })
      .populate("createdBy", "name role");

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });

  } catch (error) {
    console.error("Get Events Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};



const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(
      req.params.id
    ).populate("createdBy", "name role");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: event,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};

const createBooking = async (req, res) => {
  try {
    const resident = await Auth.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    
    if (!resident.flatNo || !resident.flatNo.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Your flat number is not assigned. Please contact the administrator.",
      });
    }

    const {
      facility,
      bookingDate,
      startTime,
      endTime,
      purpose,
    } = req.body;

    
    const existingBooking = await Booking.findOne({
      facility,
      bookingDate,
      status: {
        $in: ["Pending", "Approved"],
      },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "This facility is already booked during the selected time.",
      });
    }

    const booking = await Booking.create({
      resident: resident._id,
      flatNo: resident.flatNo.trim(),
      facility,
      bookingDate,
      startTime,
      endTime,
      purpose,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Facility booking request submitted successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create facility booking",
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      resident: req.user.id,
    }).sort({
      bookingDate: -1,
      startTime: -1,
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch facility bookings",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      resident: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};



const getPolls = async (req, res) => {
  try {
    const polls = await Poll.find({
      status: "Active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    })
      .sort({ endDate: 1 })
      .select(
        "question description options startDate endDate status createdAt"
      );

    return res.status(200).json({
      success: true,
      count: polls.length,
      data: polls,
    });
  } catch (error) {
    console.error("Get Polls Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch polls",
    });
  }
};




const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findOne({
      _id: req.params.id,
      status: "Active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).select(
      "question description options startDate endDate status createdAt"
    );

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found or is no longer active",
      });
    }

    return res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error("Get Poll Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch poll",
    });
  }
};



const voteOnPoll = async (req, res) => {
  try {
    const residentId = req.user.id;
    const pollId = req.params.id;
    const { optionId } = req.body;

    
    const poll = await Poll.findOne({
      _id: pollId,
      status: "Active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found or voting has ended",
      });
    }

    
    const selectedOption = poll.options.id(optionId);

    if (!selectedOption) {
      return res.status(400).json({
        success: false,
        message: "Invalid poll option",
      });
    }

    
    const existingVote = await PollVote.findOne({
      poll: pollId,
      resident: residentId,
    });

    if (existingVote) {
      return res.status(409).json({
        success: false,
        message: "You have already voted in this poll",
      });
    }

    
    
    await PollVote.create({
      poll: pollId,
      resident: residentId,
      optionId,
    });

    
    selectedOption.votes += 1;

    await poll.save();

    return res.status(201).json({
      success: true,
      message: "Your vote has been submitted successfully",
    });
  } catch (error) {
    console.error("Vote Poll Error:", error);

    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already voted in this poll",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit vote",
    });
  }
};

module.exports = {
  getResidentDashboard,

  getResidentProfile,
  updateResidentProfile,
  updateResidentProfilePicture,

  createComplaint,
  getMyComplaints,
  getComplaintById,

  createVisitor,
  getMyVisitors,
  getVisitorById,

  getMyMaintenance,
  getMaintenanceById,

  getNotices,
  getNoticeById,

  getEvents,
  getEventById,

  createBooking,
  getMyBookings,
  getBookingById,

  getPolls,
  getPollById,
  voteOnPoll,
};
