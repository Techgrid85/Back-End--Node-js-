const Complaint = require("../Models/complaintModel");
const Auth = require("../Models/authModel");



const getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user.id;

    const assignedComplaints = await Complaint.find({
      assignedStaff: staffId,
    })
      .populate("resident", "name email phone flatNo")
      .sort({ createdAt: -1 });

    const assignedCount = assignedComplaints.filter(
      (complaint) =>
        complaint.status === "Pending" ||
        complaint.status === "In Progress"
    ).length;

    const inProgressCount = assignedComplaints.filter(
      (complaint) => complaint.status === "In Progress"
    ).length;

    const resolvedCount = assignedComplaints.filter(
      (complaint) => complaint.status === "Resolved"
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        assignedComplaints,
        stats: {
          assigned: assignedCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
        },
      },
    });
  } catch (error) {
    console.error("Staff Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load staff dashboard",
    });
  }
};



const getAssignedComplaints = async (req, res) => {
  try {
    const staffId = req.user.id;

    const complaints = await Complaint.find({
      assignedStaff: staffId,
    })
      .populate("resident", "name email phone flatNo")
      .populate("assignedStaff", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Get Assigned Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned complaints",
    });
  }
};





const getAssignedComplaintById = async (req, res) => {
  try {
    const staffId = req.user.id;

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedStaff: staffId,
    })
      .populate("resident", "name email phone flatNo")
      .populate("assignedStaff", "name email phone");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found or not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Get Assigned Complaint Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint",
    });
  }
};




const updateComplaintStatus = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { status } = req.body;

   
    
    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint status",
      });
    }

    
    
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedStaff: staffId,
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found or not assigned to you",
      });
    }

    complaint.status = status;

    await complaint.save();

    const updatedComplaint = await Complaint.findById(
      complaint._id
    )
      .populate("resident", "name email phone flatNo")
      .populate("assignedStaff", "name email phone");

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: updatedComplaint,
    });
  } catch (error) {
    console.error("Update Complaint Status Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update complaint status",
    });
  }
};


const getCompletedComplaints = async (req, res) => {
  try {
    const staffId = req.user.id;

    const complaints = await Complaint.find({
      assignedStaff: staffId,
      status: "Resolved",
    })
      .populate("resident", "name email phone flatNo")
      .populate("assignedStaff", "name email phone")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Get Completed Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed work",
    });
  }
};


const getComplaintHistory = async (req, res) => {
  try {
    const staffId = req.user.id;

    const complaints = await Complaint.find({
      assignedStaff: staffId,
    })
      .populate("resident", "name email phone flatNo")
      .populate("assignedStaff", "name email phone")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Get Complaint History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint history",
    });
  }
};


const getStaffProfile = async (req, res) => {
  try {
    const staff = await Auth.findById(req.user.id).select(
      "-password"
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Get Staff Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load staff profile",
    });
  }
};




const updateStaffProfile = async (req, res) => {
  try {
    const staff = await Auth.findOne({
      _id: req.user.id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    const { name, email, phone } = req.body;

    // ================================
    // NAME
    // ================================
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          field: "name",
          message: "Name is required",
        });
      }

      if (name.trim().length < 3) {
        return res.status(400).json({
          success: false,
          field: "name",
          message: "Name must be at least 3 characters",
        });
      }

      staff.name = name.trim();
    }

    // ================================
    // EMAIL
    // ================================
    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          field: "email",
          message: "Please enter a valid email address",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail !== staff.email) {
        const existingEmail = await Auth.findOne({
          email: normalizedEmail,
          _id: { $ne: staff._id },
        });

        if (existingEmail) {
          return res.status(409).json({
            success: false,
            field: "email",
            message: "This email is already in use",
          });
        }

        staff.email = normalizedEmail;
      }
    }

    // ================================
    // PHONE
    // ================================
    if (phone !== undefined) {
      const cleanPhone = phone.trim();

      if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          field: "phone",
          message: "Phone number must be exactly 10 digits",
        });
      }

      staff.phone = cleanPhone;
    }

    await staff.save();

    const updatedStaff = await Auth.findById(
      staff._id
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    console.error("Update Staff Profile Error:", error);

    if (error.name === "ValidationError") {
      const firstField = Object.keys(error.errors)[0];

      return res.status(400).json({
        success: false,
        field: firstField,
        message: error.errors[firstField].message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        field: "email",
        message: "This email is already in use",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to update staff profile",
    });
  }
};
module.exports = {
  getStaffDashboard,
  getAssignedComplaints,
  getAssignedComplaintById,
  updateComplaintStatus,
  getCompletedComplaints,
  getComplaintHistory,
    getStaffProfile,
    updateStaffProfile,
};
