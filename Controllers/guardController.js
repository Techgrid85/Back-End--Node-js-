const Visitor = require("../Models/visitorModel.js");
const Auth = require("../Models/authModel.js");
const verifyGatePass = async (req, res) => {
  try {
    const { visitorId } = req.params;

    const visitor = await Visitor.findById(visitorId)
      .populate("resident", "name flatNo");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor pass not found",
      });
    }

    if (visitor.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Visitor pass has not been approved yet",
      });
    }

    if (visitor.gateStatus === "Inside") {
      return res.status(400).json({
        success: false,
        message: "Visitor is already inside",
      });
    }

    if (visitor.gateStatus === "Exited") {
      return res.status(400).json({
        success: false,
        message: "Visitor has already completed the visit",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor pass verified successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Verify Gate Pass Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify gate pass",
    });
  }
};

const approveVisitorPass = async (req, res) => {
  try {
    const { visitorId } = req.params;

    const visitor = await Visitor.findById(visitorId);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor pass not found",
      });
    }

    if (visitor.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Visitor pass is already approved",
      });
    }

    if (visitor.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Visitor visit has already been completed",
      });
    }

    if (visitor.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending visitor passes can be approved",
      });
    }

    visitor.status = "Approved";

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: "Visitor pass approved successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Approve Visitor Pass Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve visitor pass",
    });
  }
};


const createWalkInVisitor = async (req, res) => {
  try {
    const {
      resident,
      flatNo,
      visitorName,
      email,
      phone,
      purpose,
    } = req.body;

    const visitor = await Visitor.create({
      resident,
      flatNo,
      visitorName,
      email,
      phone,
      purpose,

      visitDate: new Date(),
      visitStartTime: new Date(),
      visitEndTime: new Date(
        Date.now() + 8 * 60 * 60 * 1000
      ),

      status: "Approved",
      gateStatus: "Inside",
      entryTime: new Date(),
      entryGuard: req.user.id,
      isWalkIn: true,
    });

    return res.status(201).json({
      success: true,
      message: "Walk-in visitor checked in successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Walk-in Visitor Error:", error);

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
        error.message ||
        "Failed to create walk-in visitor",
    });
  }
};


const searchVisitors = async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      gateStatus = "All",
    } = req.query;

    const query = {};


    if (search.trim()) {
      query.$or = [
        {
          visitorName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          flatNo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }


    if (status !== "All") {
      query.status = status;
    }


    if (gateStatus !== "All") {
      query.gateStatus = gateStatus;
    }

    const visitors = await Visitor.find(query)
      .populate("resident", "name flatNo phone")
      .populate("entryGuard", "name")
      .populate("exitGuard", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Search Visitors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search visitors",
    });
  }
};

const markVisitorEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    if (visitor.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved visitors can enter",
      });
    }

    if (visitor.gateStatus === "Inside") {
      return res.status(400).json({
        success: false,
        message: "Visitor is already inside",
      });
    }

    if (visitor.gateStatus === "Exited") {
      return res.status(400).json({
        success: false,
        message: "Visitor has already completed the visit",
      });
    }

    visitor.gateStatus = "Inside";
    visitor.entryTime = new Date();
    visitor.entryGuard = req.user.id;

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: "Visitor entry recorded successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Mark Entry Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record visitor entry",
    });
  }
};

const markVisitorExit = async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    if (visitor.gateStatus !== "Inside") {
      return res.status(400).json({
        success: false,
        message: "Visitor is not currently inside",
      });
    }

    visitor.gateStatus = "Exited";
    visitor.exitTime = new Date();
    visitor.exitGuard = req.user.id;
    visitor.status = "Completed";

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: "Visitor exit recorded successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Mark Exit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record visitor exit",
    });
  }
};

const getActiveVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      gateStatus: "Inside",
    })
      .populate("resident", "name flatNo")
      .populate("entryGuard", "name")
      .sort({ entryTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Active Visitors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load active visitors",
    });
  }
};

const getEntryLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      entryTime: { $ne: null },
    })
      .populate("resident", "name flatNo")
      .populate("entryGuard", "name")
      .sort({ entryTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Entry Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load entry logs",
    });
  }
};
const getExitLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      exitTime: { $ne: null },
    })
      .populate("resident", "name flatNo")
      .populate("entryGuard", "name")
      .populate("exitGuard", "name")
      .sort({ exitTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Exit Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load exit logs",
    });
  }
};
const getOverstayAlerts = async (req, res) => {
  try {
    const hoursAgo = new Date(
      Date.now() - 4 * 60 * 60 * 1000
    );

    const visitors = await Visitor.find({
      gateStatus: "Inside",
      entryTime: { $lte: hoursAgo },
    })
      .populate("resident", "name flatNo")
      .populate("entryGuard", "name")
      .sort({ entryTime: 1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Overstay Alerts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load overstay alerts",
    });
  }
};

const getWaitingVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      status: "Pending",
      gateStatus: {
        $nin: ["Inside", "Exited"],
      },
      entryTime: null,
    })
      .populate("resident", "name flatNo")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Waiting Visitors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load waiting visitors",
    });
  }
};


const getApprovedVisitorPasses = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      status: "Approved",
      gateStatus: "Not Entered",
      entryTime: null,
    })
      .populate("resident", "name flatNo")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Approved visitor passes fetched successfully",
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Get Approved Visitor Passes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved visitor passes",
    });
  }
};
const getPendingVisitorPasses = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      status: "Pending",
    })
      .populate("resident", "name flatNo phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Pending visitor passes fetched successfully",
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Get Pending Visitor Passes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending visitor passes",
    });
  }
};
const getResidents = async (req, res) => {
  try {
    const residents = await Auth.find({
      role: "resident",
      isActive: true,
    })
      .select("_id name flatNo phone email")
      .sort({ flatNo: 1 });

    console.log("RESIDENTS FOUND:", residents);

    return res.status(200).json({
      success: true,
      count: residents.length,
      data: residents,
    });
  } catch (error) {
    console.error("Get Residents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load residents",
    });
  }
};

const getGuardProfile = async (req, res) => {
  try {
    const guard = await Auth.findById(req.user.id).select("-password");

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Guard profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: guard,
    });
  } catch (error) {
    console.error("Get Guard Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load guard profile",
    });
  }
};


const updateGuardProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      flatNo,
    } = req.body;

    const guard = await Auth.findById(req.user.id);

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Guard profile not found",
      });
    }

    if (email && email.toLowerCase().trim() !== guard.email) {
      const existingEmail = await Auth.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: guard._id },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "This email is already in use",
        });
      }

      guard.email = email.toLowerCase().trim();
    }

    
    if (name) {
      guard.name = name.trim();
    }

    if (phone) {
      guard.phone = phone.trim();
    }

    if (flatNo) {
      guard.flatNo = flatNo.trim();
    }

    await guard.save();

    return res.status(200).json({
      success: true,
      message: "Guard profile updated successfully",
      data: {
        _id: guard._id,
        name: guard.name,
        email: guard.email,
        phone: guard.phone,
        flatNo: guard.flatNo,
        role: guard.role,
        profilePic: guard.profilePic,
        isActive: guard.isActive,
      },
    });
  } catch (error) {
    console.error("Update Guard Profile Error:", error);

    
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
      message: error.message || "Failed to update guard profile",
    });
  }
};



module.exports = {
  verifyGatePass,
  approveVisitorPass,
  createWalkInVisitor,
  getResidents,
  searchVisitors,
  markVisitorEntry,
  markVisitorExit,
  getActiveVisitors,
  getEntryLogs,
  getExitLogs,
  getOverstayAlerts,
  getWaitingVisitors,
  getApprovedVisitorPasses,
  getPendingVisitorPasses,
  getGuardProfile,
  updateGuardProfile,
};