const Complaint = require("../Models/complaintModel.js");
const Auth = require("../Models/authModel.js");
const Visitor = require("../Models/visitorModel.js");
const Flat = require("../Models/flatModel.js");
const Maintenance = require("../Models/maintenanceModel.js");
const Booking = require("../Models/bookingModel.js");
const Notice = require("../Models/noticeModel.js");
const Poll = require("../Models/pollModel.js");
const PollVote = require("../Models/pollVoteModel.js");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const getAdminDashboard = async (req, res) => {
  try {
    
    const totalResidents = await Auth.countDocuments({
      role: "resident",
    });

    const activeResidents = await Auth.countDocuments({
      role: "resident",
      isActive: true,
    });

    const totalGuards = await Auth.countDocuments({
      role: "guard",
    });

    const activeGuards = await Auth.countDocuments({
      role: "guard",
      isActive: true,
    });

    const totalStaff = await Auth.countDocuments({
      role: "staff",
    });

    const activeStaff = await Auth.countDocuments({
      role: "staff",
      isActive: true,
    });


    const totalComplaints = await Complaint.countDocuments();

    const pendingComplaints = await Complaint.countDocuments({
      status: "Pending",
    });

    const inProgressComplaints = await Complaint.countDocuments({
      status: "In Progress",
    });

    const resolvedComplaints = await Complaint.countDocuments({
      status: "Resolved",
    });

    const rejectedComplaints = await Complaint.countDocuments({
      status: "Rejected",
    });

    const unassignedComplaints = await Complaint.countDocuments({
      assignedStaff: null,
    });


    const totalVisitors = await Visitor.countDocuments();

    const pendingVisitors = await Visitor.countDocuments({
      status: "Pending",
    });

    const approvedVisitors = await Visitor.countDocuments({
      status: "Approved",
    });

    const rejectedVisitors = await Visitor.countDocuments({
      status: "Rejected",
    });

    const completedVisitors = await Visitor.countDocuments({
      status: "Completed",
    });

    const activeVisitors = await Visitor.countDocuments({
      gateStatus: "Inside",
    });

    const exitedVisitors = await Visitor.countDocuments({
      gateStatus: "Exited",
    });

    const walkInVisitors = await Visitor.countDocuments({
      isWalkIn: true,
    });


    const recentComplaints = await Complaint.find()
      .populate("resident", "name flatNo")
      .populate("assignedStaff", "name")
      .sort({ createdAt: -1 })
      .limit(5);


    const recentVisitors = await Visitor.find()
      .populate("resident", "name flatNo")
      .populate("entryGuard", "name")
      .populate("exitGuard", "name")
      .sort({ createdAt: -1 })
      .limit(5);


   
    return res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully",

      data: {
        users: {
          residents: {
            total: totalResidents,
            active: activeResidents,
          },

          guards: {
            total: totalGuards,
            active: activeGuards,
          },

          staff: {
            total: totalStaff,
            active: activeStaff,
          },
        },

        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          rejected: rejectedComplaints,
          unassigned: unassignedComplaints,
        },

        visitors: {
          total: totalVisitors,
          pending: pendingVisitors,
          approved: approvedVisitors,
          rejected: rejectedVisitors,
          completed: completedVisitors,
          active: activeVisitors,
          exited: exitedVisitors,
          walkIn: walkInVisitors,
        },

        recentComplaints,
        recentVisitors,
      },
    });
  } catch (error) {
    console.error("Get Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard data",
      error: error.message,
    });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("resident", "name email phone flatNo")
      .populate("assignedStaff", "name email phone flatNo")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Get All Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await Auth.find({
      role: "staff",
      isActive: true,
    })
      .select("name email phone flatNo role")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    console.error("Get All Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff members",
    });
  }
};

const assignStaffToComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { staffId, adminRemark } = req.body;

   
    
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const staff = await Auth.findOne({
      _id: staffId,
      role: "staff",
      isActive: true,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Active staff member not found",
      });
    }

    complaint.assignedStaff = staff._id;

    if (adminRemark !== undefined) {
      complaint.adminRemark = adminRemark.trim();
    }

    if (complaint.status === "Pending") {
      complaint.status = "In Progress";
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(
      complaint._id
    )
      .populate("resident", "name email phone flatNo")
      .populate("assignedStaff", "name email phone flatNo");

    return res.status(200).json({
      success: true,
      message: "Staff assigned to complaint successfully",
      data: updatedComplaint,
    });
  } catch (error) {
    console.error("Assign Staff Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint or staff ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to assign staff",
    });
  }
};

const getAllResidents = async (req, res) => {
  try {
    const residents = await Auth.find({
      role: "resident",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: residents.length,
      data: residents,
    });
  } catch (error) {
    console.error("Get All Residents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch residents",
    });
  }
};

const createResident = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, email, password, phone, flatNo } = req.body;

    if (!name || !email || !password || !phone || !flatNo) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, phone and flat number are required",
      });
    }

    const normalizedFlatNo = flatNo.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    session.startTransaction();

    const existingUser = await Auth.findOne({
      email: normalizedEmail,
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const flat = await Flat.findOne({
      flatNo: normalizedFlatNo,
    }).session(session);

    if (!flat) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Selected flat does not exist",
      });
    }

    if (flat.resident || flat.status === "Occupied") {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "This flat is already assigned to another resident",
      });
    }

    if (flat.status === "Maintenance") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This flat is currently under maintenance",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const resident = new Auth({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      flatNo: normalizedFlatNo,
      role: "resident",
      isActive: true,
    });

    await resident.save({ session });

    flat.resident = resident._id;
    flat.status = "Occupied";

    await flat.save({ session });

    await session.commitTransaction();


    
    const residentData = resident.toObject();
    delete residentData.password;

    return res.status(201).json({
      success: true,
      message: "Resident created and assigned to flat successfully",
      data: residentData,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Create Resident Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create resident",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
const getResidentById = async (req, res) => {
  try {
    const { residentId } = req.params;

    const resident = await Auth.findOne({
      _id: residentId,
      role: "resident",
    }).select("-password");

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: resident,
    });
  } catch (error) {
    console.error("Get Resident Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid resident ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch resident",
    });
  }
};

const updateResident = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { residentId } = req.params;

    const {
      name,
      email,
      phone,
      flatNo,
      isActive,
    } = req.body;

    session.startTransaction();

    const resident = await Auth.findOne({
      _id: residentId,
      role: "resident",
    }).session(session);

    if (!resident) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }
    if (name !== undefined) {
      resident.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail !== resident.email) {
        const existingEmail = await Auth.findOne({
          email: normalizedEmail,
          _id: { $ne: resident._id },
        }).session(session);

        if (existingEmail) {
          await session.abortTransaction();

          return res.status(409).json({
            success: false,
            message: "Email is already in use",
          });
        }

        resident.email = normalizedEmail;
      }
    }

    if (phone !== undefined) {
      resident.phone = phone.trim();
    }

    if (isActive !== undefined) {
      resident.isActive = isActive;
    }

    if (flatNo !== undefined) {
      const normalizedNewFlatNo = flatNo.trim().toUpperCase();
      const currentFlatNo = resident.flatNo;

     
      
      if (normalizedNewFlatNo !== currentFlatNo) {
        const newFlat = await Flat.findOne({
          flatNo: normalizedNewFlatNo,
        }).session(session);

        if (!newFlat) {
          await session.abortTransaction();

          return res.status(404).json({
            success: false,
            message: "Selected new flat does not exist",
          });
        }

        if (newFlat.resident || newFlat.status === "Occupied") {
          await session.abortTransaction();

          return res.status(409).json({
            success: false,
            message:
              "Selected flat is already assigned to another resident",
          });
        }

        if (newFlat.status === "Maintenance") {
          await session.abortTransaction();

          return res.status(400).json({
            success: false,
            message:
              "Selected flat is currently under maintenance",
          });
        }
        const oldFlat = await Flat.findOne({
          flatNo: currentFlatNo,
        }).session(session);

        if (oldFlat) {
          oldFlat.resident = null;
          oldFlat.status = "Vacant";

          await oldFlat.save({ session });
        }

        newFlat.resident = resident._id;
        newFlat.status = "Occupied";

        await newFlat.save({ session });

        resident.flatNo = normalizedNewFlatNo;
      }
    }

    await resident.save({ session });

    await session.commitTransaction();

    const updatedResident = resident.toObject();
    delete updatedResident.password;

    return res.status(200).json({
      success: true,
      message: "Resident updated successfully",
      data: updatedResident,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Update Resident Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid resident ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already in use",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update resident",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
const toggleResidentStatus = async (req, res) => {
  try {
    const { residentId } = req.params;

    const resident = await Auth.findOne({
      _id: residentId,
      role: "resident",
    });

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    resident.isActive = !resident.isActive;

    await resident.save();

    return res.status(200).json({
      success: true,
      message: resident.isActive
        ? "Resident activated successfully"
        : "Resident deactivated successfully",
      data: {
        _id: resident._id,
        isActive: resident.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle Resident Status Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid resident ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update resident status",
    });
  }
};
const getAllFlats = async (req, res) => {
  try {
    const flats = await Flat.find()
      .populate("resident", "name email phone")
      .sort({ block: 1, flatNo: 1 });

    return res.status(200).json({
      success: true,
      count: flats.length,
      data: flats,
    });
  } catch (error) {
    console.error("Get All Flats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch flats",
    });
  }
};


const getFlatById = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.flatId).populate(
      "resident",
      "name email phone"
    );

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: flat,
    });
  } catch (error) {
    console.error("Get Flat Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch flat",
    });
  }
};

const createFlat = async (req, res) => {
  try {
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

    const existingFlat = await Flat.findOne({
      flatNo: flatNo.trim().toUpperCase(),
    });

    if (existingFlat) {
      return res.status(409).json({
        success: false,
        message: "A flat with this flat number already exists",
      });
    }

    const flat = await Flat.create({
      flatNo: flatNo.trim().toUpperCase(),
      block: block.trim().toUpperCase(),
      floor: Number(floor),
      type,
      status: status || "Vacant",
    });

    return res.status(201).json({
      success: true,
      message: "Flat created successfully",
      data: flat,
    });
  } catch (error) {
    console.error("Create Flat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create flat",
      error: error.message,
    });
  }
};

const updateFlat = async (req, res) => {
  try {
    const { flatId } = req.params;
    const { flatNo, block, floor, type, status } = req.body;

    const flat = await Flat.findById(flatId);

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if (
      flat.resident &&
      status &&
      status === "Vacant"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot mark an occupied flat as vacant while a resident is assigned",
      });
    }

    if (flatNo !== undefined) {
      const normalizedFlatNo = flatNo.trim().toUpperCase();

      const duplicateFlat = await Flat.findOne({
        flatNo: normalizedFlatNo,
        _id: { $ne: flatId },
      });

      if (duplicateFlat) {
        return res.status(409).json({
          success: false,
          message: "Another flat already uses this flat number",
        });
      }

      flat.flatNo = normalizedFlatNo;
    }

    if (block !== undefined) {
      flat.block = block.trim().toUpperCase();
    }

    if (floor !== undefined) {
      flat.floor = Number(floor);
    }

    if (type !== undefined) {
      flat.type = type;
    }

    if (status !== undefined) {
      flat.status = status;
    }

    await flat.save();

    const updatedFlat = await Flat.findById(flat._id).populate(
      "resident",
      "name email phone"
    );

    return res.status(200).json({
      success: true,
      message: "Flat updated successfully",
      data: updatedFlat,
    });
  } catch (error) {
    console.error("Update Flat Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID or data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update flat",
      error: error.message,
    });
  }
};

const deleteFlat = async (req, res) => {
  try {
    const { flatId } = req.params;

    const flat = await Flat.findById(flatId);

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if (flat.resident) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a flat while a resident is assigned",
      });
    }

    await Flat.findByIdAndDelete(flatId);

    return res.status(200).json({
      success: true,
      message: "Flat deleted successfully",
    });
  } catch (error) {
    console.error("Delete Flat Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete flat",
    });
  }
};
const getAvailableFlats = async (req, res) => {
  try {
    const flats = await Flat.find({
      status: "Vacant",
      resident: null,
    })
      .select("flatNo block floor type status")
      .sort({ block: 1, flatNo: 1 });

    return res.status(200).json({
      success: true,
      count: flats.length,
      data: flats,
    });
  } catch (error) {
    console.error("Get Available Flats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available flats",
    });
  }
};

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `INV-${timestamp}-${random}`;
};

const getAllMaintenance = async (req, res) => {
  try {
      const maintenance = await Maintenance.find()
          .populate(
              "resident",
              "name email phone flatNo"
          )
          .populate(
              "complaint",
              "subject description category status assignedStaff"
          )
          .sort({ dueDate: -1 });

    return res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance,
    });
  } catch (error) {
    console.error("Get All Maintenance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance bills",
    });
  }
};
const getMaintenanceById = async (req, res) => {
  try {
    const { maintenanceId } = req.params;

      const maintenance = await Maintenance.findById(
          maintenanceId
      )
          .populate(
              "resident",
              "name email phone flatNo"
          )
          .populate(
              "complaint",
              "subject description category status assignedStaff"
          );

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance bill not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    console.error("Get Maintenance Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance bill ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance bill",
    });
  }
};
const createMaintenance = async (req, res) => {
  try {
    const {
      resident,
      amount,
      month,
      dueDate,
    } = req.body;

    if (
      !resident ||
      amount === undefined ||
      !month ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Resident, amount, month and due date are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(resident)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resident ID",
      });
    }
    const residentData = await Auth.findOne({
      _id: resident,
      role: "resident",
      isActive: true,
    });

    if (!residentData) {
      return res.status(404).json({
        success: false,
        message: "Active resident not found",
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount cannot be negative",
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    const existingBill = await Maintenance.findOne({
      resident: residentData._id,
      month: month.trim(),
    });

    if (existingBill) {
      return res.status(409).json({
        success: false,
        message:
          "A maintenance bill already exists for this resident and month",
      });
    }

      const maintenance = await Maintenance.create({
          resident: residentData._id,
          flatNo: residentData.flatNo,
          amount: Number(amount),
          month: month.trim(),
          dueDate: parsedDueDate,
          status: "Pending",

          invoiceNumber: generateInvoiceNumber(),

          source: "Normal",
          complaint: null,
      });

    const createdMaintenance =
      await Maintenance.findById(
        maintenance._id
      ).populate(
        "resident",
        "name email phone flatNo"
      );

    return res.status(201).json({
      success: true,
      message: "Maintenance bill created successfully",
      data: createdMaintenance,
    });
  } catch (error) {
    console.error("Create Maintenance Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((item) => item.message)
          .join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create maintenance bill",
    });
  }
};
const updateMaintenance = async (req, res) => {
  try {
    const { maintenanceId } = req.params;

    const {
      resident,
      amount,
      month,
      dueDate,
      status,
    } = req.body;

    const maintenance =
      await Maintenance.findById(maintenanceId);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance bill not found",
      });
    }

    if (resident !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(resident)) {
        return res.status(400).json({
          success: false,
          message: "Invalid resident ID",
        });
      }

      const residentData = await Auth.findOne({
        _id: resident,
        role: "resident",
        isActive: true,
      });

      if (!residentData) {
        return res.status(404).json({
          success: false,
          message: "Active resident not found",
        });
      }

      maintenance.resident = residentData._id;
      maintenance.flatNo = residentData.flatNo;
    }

    if (amount !== undefined) {
      if (Number(amount) < 0) {
        return res.status(400).json({
          success: false,
          message: "Amount cannot be negative",
        });
      }

      maintenance.amount = Number(amount);
    }

    if (month !== undefined) {
      if (!month.trim()) {
        return res.status(400).json({
          success: false,
          message: "Month cannot be empty",
        });
      }

      maintenance.month = month.trim();
    }

    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);

      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
        });
      }

      maintenance.dueDate = parsedDueDate;
    }

    if (status !== undefined) {
      const allowedStatuses = [
        "Pending",
        "Paid",
        "Overdue",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid maintenance status",
        });
      }

      maintenance.status = status;

      if (status === "Paid" && !maintenance.paidAt) {
        maintenance.paidAt = new Date();
      }

      if (status !== "Paid") {
        maintenance.paidAt = null;
        maintenance.transactionId = "";
      }
    }

    await maintenance.save();

    const updatedMaintenance =
      await Maintenance.findById(
        maintenance._id
      ).populate(
        "resident",
        "name email phone flatNo"
      );

    return res.status(200).json({
      success: true,
      message: "Maintenance bill updated successfully",
      data: updatedMaintenance,
    });
  } catch (error) {
    console.error("Update Maintenance Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance bill ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update maintenance bill",
    });
  }
};
const markMaintenancePaid = async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const { transactionId } = req.body;

    const maintenance =
      await Maintenance.findById(maintenanceId);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance bill not found",
      });
    }

    if (maintenance.status === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Maintenance bill is already paid",
      });
    }

    maintenance.status = "Paid";
    maintenance.paidAt = new Date();

    if (transactionId !== undefined) {
      maintenance.transactionId =
        transactionId.trim();
    }

    await maintenance.save();

    const updatedMaintenance =
      await Maintenance.findById(
        maintenance._id
      ).populate(
        "resident",
        "name email phone flatNo"
      );

    return res.status(200).json({
      success: true,
      message: "Maintenance bill marked as paid",
      data: updatedMaintenance,
    });
  } catch (error) {
    console.error(
      "Mark Maintenance Paid Error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance bill ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark maintenance bill as paid",
    });
  }
};
const deleteMaintenance = async (req, res) => {
  try {
    const { maintenanceId } = req.params;

    const maintenance =
      await Maintenance.findById(maintenanceId);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance bill not found",
      });
    }
    if (maintenance.status === "Paid") {
      return res.status(400).json({
        success: false,
        message:
          "Paid maintenance bills cannot be deleted",
      });
    }

    await Maintenance.findByIdAndDelete(
      maintenanceId
    );

    return res.status(200).json({
      success: true,
      message: "Maintenance bill deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Maintenance Error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance bill ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete maintenance bill",
    });
  }
};
const getSecurityOverview = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalVisitors,
      activeVisitors,
      todayEntries,
      todayExits,
      pendingVisitors,
      walkInVisitors,
      overstayVisitors,
    ] = await Promise.all([
      Visitor.countDocuments(),

      Visitor.countDocuments({
        gateStatus: "Inside",
      }),

      Visitor.countDocuments({
        entryTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),

      Visitor.countDocuments({
        exitTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),

      Visitor.countDocuments({
        status: "Pending",
      }),

      Visitor.countDocuments({
        isWalkIn: true,
      }),

      Visitor.countDocuments({
        gateStatus: "Inside",
        entryTime: {
          $lte: new Date(
            Date.now() - 8 * 60 * 60 * 1000
          ),
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        activeVisitors,
        todayEntries,
        todayExits,
        pendingVisitors,
        walkInVisitors,
        overstayVisitors,
      },
    });
  } catch (error) {
    console.error("Admin Security Overview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch security overview",
    });
  }
};
const getAdminSecurityLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "entryGuard",
        "name email phone"
      )
      .populate(
        "exitGuard",
        "name email phone"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Admin Security Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch security logs",
    });
  }
};
const getAdminActiveVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      gateStatus: "Inside",
    })
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "entryGuard",
        "name email phone"
      )
      .sort({ entryTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Admin Active Visitors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active visitors",
    });
  }
};
const getAdminEntryLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      entryTime: { $ne: null },
    })
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "entryGuard",
        "name email phone"
      )
      .populate(
        "exitGuard",
        "name email phone"
      )
      .sort({ entryTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Admin Entry Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch entry logs",
    });
  }
};

const getAdminExitLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      exitTime: { $ne: null },
    })
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "entryGuard",
        "name email phone"
      )
      .populate(
        "exitGuard",
        "name email phone"
      )
      .sort({ exitTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Admin Exit Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exit logs",
    });
  }
};


const getAdminOverstayVisitors = async (req, res) => {
  try {
    const overstayLimit = new Date(
      Date.now() - 8 * 60 * 60 * 1000
    );

    const visitors = await Visitor.find({
      gateStatus: "Inside",
      entryTime: {
        $lte: overstayLimit,
      },
    })
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "entryGuard",
        "name email phone"
      )
      .sort({ entryTime: 1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Admin Overstay Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch overstay alerts",
    });
  }
};


const searchAdminVisitors = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || !search.trim()) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const searchValue = search.trim();

    const visitors = await Visitor.find({
      $or: [
        {
          visitorName: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          flatNo: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ],
    })
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "entryGuard",
        "name email phone"
      )
      .populate(
        "exitGuard",
        "name email phone"
      )
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Admin Search Visitors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search visitors",
    });
  }
};
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .sort({
        bookingDate: -1,
        startTime: -1,
      });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get All Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch facility bookings",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate(
        "resident",
        "name email phone flatNo"
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Facility booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch facility booking",
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, remarks } = req.body;

    const allowedStatuses = [
      "Pending",
      "Approved",
      "Rejected",
      "Cancelled",
      "Completed",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Facility booking not found",
      });
    }

    if (
      (booking.status === "Cancelled" ||
        booking.status === "Completed") &&
      status === "Approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled or completed bookings cannot be approved",
      });
    }
    if (status === "Approved") {
      const conflictingBooking = await Booking.findOne({
        _id: { $ne: booking._id },

        facility: booking.facility,

        bookingDate: booking.bookingDate,

        status: "Approved",

        $or: [
          {
            startTime: { $lt: booking.endTime },
            endTime: { $gt: booking.startTime },
          },
        ],
      });

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          message:
            "Another approved booking already exists for this facility during the selected time.",
        });
      }
    }

    booking.status = status;

    if (remarks !== undefined) {
      booking.remarks = remarks.trim();
    }

    await booking.save();

    const updatedBooking = await Booking.findById(
      booking._id
    ).populate(
      "resident",
      "name email phone flatNo"
    );

    return res.status(200).json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error(
      "Update Booking Status Error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update booking status",
    });
  }
};


const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Facility booking not found",
      });
    }

    if (
      booking.status === "Approved" ||
      booking.status === "Completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Approved or completed bookings cannot be deleted",
      });
    }

    await Booking.findByIdAndDelete(bookingId);

    return res.status(200).json({
      success: true,
      message: "Facility booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete Booking Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete facility booking",
    });
  }
};

const createNotice = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const notice = await Notice.create({
      title,
      description,
      priority: priority || "Normal",
      createdBy: req.user.id,
    });

    const populatedNotice = await Notice.findById(notice._id)
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Notice created successfully",
      data: populatedNotice,
    });
  } catch (error) {
    console.error("Create Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create notice",
      error: error.message,
    });
  }
};


const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    console.error("Get All Notices Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notices",
    });
  }
};


const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate("createdBy", "name email");

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
    console.error("Get Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notice",
    });
  }
};


const updateNotice = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    if (title !== undefined) {
      notice.title = title;
    }

    if (description !== undefined) {
      notice.description = description;
    }

    if (priority !== undefined) {
      notice.priority = priority;
    }

    await notice.save();

    const updatedNotice = await Notice.findById(notice._id)
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      data: updatedNotice,
    });
  } catch (error) {
    console.error("Update Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notice",
      error: error.message,
    });
  }
};


const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Delete Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notice",
    });
  }
};
const createPoll = async (req, res) => {
  try {
    const {
      question,
      description,
      options,
      startDate,
      endDate,
      status,
    } = req.body;


    if (
      !question ||
      !options ||
      !Array.isArray(options) ||
      options.length < 2 ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Question, at least 2 options, start date and end date are required",
      });
    }

    const formattedOptions = options
      .map((option) => {
        if (typeof option === "string") {
          return {
            text: option.trim(),
            votes: 0,
          };
        }

        return {
          text: option.text?.trim(),
          votes: 0,
        };
      })
      .filter((option) => option.text);

    if (formattedOptions.length < 2) {
      return res.status(400).json({
        success: false,
        message: "A poll must have at least 2 valid options",
      });
    }
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      isNaN(parsedStartDate.getTime()) ||
      isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date or end date",
      });
    }

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const allowedStatuses = [
      "Draft",
      "Active",
      "Closed",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid poll status",
      });
    }

    const poll = await Poll.create({
      question: question.trim(),
      description: description?.trim() || "",
      options: formattedOptions,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      createdBy: req.user.id,
      status: status || "Active",
    });

    const createdPoll = await Poll.findById(poll._id)
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: createdPoll,
    });
  } catch (error) {
    console.error("Create Poll Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create poll",
      error: error.message,
    });
  }
};


const getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: polls.length,
      data: polls,
    });
  } catch (error) {
    console.error("Get All Polls Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch polls",
    });
  }
};


const getPollById = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId)
      .populate("createdBy", "name email");

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    const totalVotes = poll.options.reduce(
      (total, option) => total + option.votes,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        ...poll.toObject(),
        totalVotes,
      },
    });
  } catch (error) {
    console.error("Get Poll Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid poll ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch poll",
    });
  }
};


const updatePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    const {
      question,
      description,
      options,
      startDate,
      endDate,
    } = req.body;

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

   
    if (poll.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Closed polls cannot be edited",
      });
    }

    if (question !== undefined) {
      if (!question.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question cannot be empty",
        });
      }

      poll.question = question.trim();
    }

    if (description !== undefined) {
      poll.description = description.trim();
    }

    if (options !== undefined) {
      const existingVotes = await PollVote.countDocuments({
        poll: poll._id,
      });

      if (existingVotes > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Poll options cannot be changed after voting has started",
        });
      }

      if (
        !Array.isArray(options) ||
        options.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A poll must have at least 2 options",
        });
      }

      const formattedOptions = options
        .map((option) => {
          if (typeof option === "string") {
            return {
              text: option.trim(),
              votes: 0,
            };
          }

          return {
            text: option.text?.trim(),
            votes: 0,
          };
        })
        .filter((option) => option.text);

      if (formattedOptions.length < 2) {
        return res.status(400).json({
          success: false,
          message:
            "A poll must have at least 2 valid options",
        });
      }

      poll.options = formattedOptions;
    }

    if (startDate !== undefined) {
      const parsedStartDate = new Date(startDate);

      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      poll.startDate = parsedStartDate;
    }

    if (endDate !== undefined) {
      const parsedEndDate = new Date(endDate);

      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date",
        });
      }

      poll.endDate = parsedEndDate;
    }

    if (poll.endDate <= poll.startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    await poll.save();

    const updatedPoll = await Poll.findById(poll._id)
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Poll updated successfully",
      data: updatedPoll,
    });
  } catch (error) {
    console.error("Update Poll Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid poll ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update poll",
      error: error.message,
    });
  }
};


const updatePollStatus = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Draft",
      "Active",
      "Closed",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid poll status",
      });
    }

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    poll.status = status;

    await poll.save();

    return res.status(200).json({
      success: true,
      message: `Poll status changed to ${status}`,
      data: poll,
    });
  } catch (error) {
    console.error("Update Poll Status Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid poll ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update poll status",
    });
  }
};


const deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    await PollVote.deleteMany({
      poll: poll._id,
    });

    await Poll.findByIdAndDelete(pollId);

    return res.status(200).json({
      success: true,
      message: "Poll and its votes deleted successfully",
    });
  } catch (error) {
    console.error("Delete Poll Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid poll ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete poll",
    });
  }
};
const getAllAdminStaff = async (req, res) => {
  try {
    const staff = await Auth.find({
      role: "staff",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    console.error("Get All Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff members",
    });
  }
};

const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

   
    
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and phone are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

   
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await Auth.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

   
    const hashedPassword = await bcrypt.hash(password, 10);

  
    const staff = await Auth.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      role: "staff",
      flatNo: "",
      isActive: true,
    });

    const staffData = staff.toObject();
    delete staffData.password;

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: staffData,
    });
  } catch (error) {
    console.error("Create Staff Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create staff member",
      error: error.message,
    });
  }
};


const getStaffById = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await Auth.findOne({
      _id: staffId,
      role: "staff",
    }).select("-password");

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
    console.error("Get Staff Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff member",
    });
  }
};


const updateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, phone, isActive } = req.body;

    const staff = await Auth.findOne({
      _id: staffId,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

  
    if (name !== undefined) {
      staff.name = name.trim();
    }

    
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail !== staff.email) {
        const existingEmail = await Auth.findOne({
          email: normalizedEmail,
          _id: { $ne: staff._id },
        });

        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: "Email is already in use",
          });
        }

        staff.email = normalizedEmail;
      }
    }


    if (phone !== undefined) {
      staff.phone = phone.trim();
    }

   
    if (isActive !== undefined) {
      staff.isActive = isActive;
    }

    await staff.save();

    const staffData = staff.toObject();
    delete staffData.password;

    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: staffData,
    });
  } catch (error) {
    console.error("Update Staff Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already in use",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update staff member",
    });
  }
};


const toggleStaffStatus = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await Auth.findOne({
      _id: staffId,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    staff.isActive = !staff.isActive;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: staff.isActive
        ? "Staff member activated successfully"
        : "Staff member deactivated successfully",
      data: {
        _id: staff._id,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle Staff Status Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update staff status",
    });
  }
};
const getAllGuards = async (req, res) => {
  try {
    const guards = await Auth.find({
      role: "guard",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: guards.length,
      data: guards,
    });
  } catch (error) {
    console.error("Get All Guards Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guards",
    });
  }
};


const createGuard = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and phone are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingGuard = await Auth.findOne({
      email: normalizedEmail,
    });

    if (existingGuard) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const guard = await Auth.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      role: "guard",
      flatNo: "",
      isActive: true,
    });

    const guardData = guard.toObject();
    delete guardData.password;

    return res.status(201).json({
      success: true,
      message: "Guard created successfully",
      data: guardData,
    });
  } catch (error) {
    console.error("Create Guard Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create guard",
    });
  }
};


const getGuardById = async (req, res) => {
  try {
    const { guardId } = req.params;

    const guard = await Auth.findOne({
      _id: guardId,
      role: "guard",
    }).select("-password");

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Guard not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: guard,
    });
  } catch (error) {
    console.error("Get Guard Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid guard ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guard",
    });
  }
};


const updateGuard = async (req, res) => {
  try {
    const { guardId } = req.params;
    const { name, email, phone } = req.body;

    const guard = await Auth.findOne({
      _id: guardId,
      role: "guard",
    });

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Guard not found",
      });
    }

    if (name !== undefined) {
      guard.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail !== guard.email) {
        const existingEmail = await Auth.findOne({
          email: normalizedEmail,
          _id: { $ne: guard._id },
        });

        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: "Email is already in use",
          });
        }

        guard.email = normalizedEmail;
      }
    }

    if (phone !== undefined) {
      guard.phone = phone.trim();
    }

    await guard.save();

    const guardData = guard.toObject();
    delete guardData.password;

    return res.status(200).json({
      success: true,
      message: "Guard updated successfully",
      data: guardData,
    });
  } catch (error) {
    console.error("Update Guard Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid guard ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already in use",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update guard",
    });
  }
};


const toggleGuardStatus = async (req, res) => {
  try {
    const { guardId } = req.params;

    const guard = await Auth.findOne({
      _id: guardId,
      role: "guard",
    });

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Guard not found",
      });
    }

    guard.isActive = !guard.isActive;

    await guard.save();

    return res.status(200).json({
      success: true,
      message: guard.isActive
        ? "Guard activated successfully"
        : "Guard deactivated successfully",
      data: {
        _id: guard._id,
        isActive: guard.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle Guard Status Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid guard ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update guard status",
    });
  }
};


const getCompletedComplaintsForAdmin = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: "Resolved",
      assignedStaff: { $ne: null },
    })
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "assignedStaff",
        "name email phone"
      )
      .sort({ updatedAt: -1 })
      .lean();

    const complaintIds = complaints.map(
      (complaint) => complaint._id
    );

    const bills = await Maintenance.find({
      complaint: { $in: complaintIds },
      source: "Complaint",
    })
      .select(
        "_id resident complaint amount month dueDate status source createdAt"
      )
      .lean();

    const complaintsWithBills = complaints.map(
      (complaint) => {
        const bill = bills.find(
          (bill) =>
            bill.complaint?.toString() ===
            complaint._id.toString()
        );

        return {
          ...complaint,
          bill: bill || null,
        };
      }
    );

    return res.status(200).json({
      success: true,
      count: complaintsWithBills.length,
      data: complaintsWithBills,
    });
  } catch (error) {
    console.error(
      "Get Completed Complaints Admin Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed complaints",
    });
  }
};
const generateComplaintBill = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const {
      amount,
      dueDate,
    } = req.body;


    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }



    if (
      amount === undefined ||
      amount === "" ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount and due date are required",
      });
    }


    if (Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount cannot be negative",
      });
    }

  

    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }



    const complaint = await Complaint.findOne({
      _id: complaintId,
      status: "Resolved",
    }).populate(
      "resident",
      "name email phone flatNo"
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Completed complaint not found",
      });
    }



    const existingBill = await Maintenance.findOne({
      complaint: complaint._id,
      source: "Complaint",
    });

    if (existingBill) {
      return res.status(409).json({
        success: false,
        message: "A bill has already been generated for this complaint",
        data: existingBill,
      });
    }



    const month = new Date().toLocaleString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

 
      const maintenance = await Maintenance.create({
          resident: complaint.resident._id,
          flatNo: complaint.flatNo,
          amount: Number(amount),
          month,
          dueDate: parsedDueDate,
          status: "Pending",

          invoiceNumber: generateInvoiceNumber(),

          source: "Complaint",
          complaint: complaint._id,
      });

    const createdBill =
      await Maintenance.findById(
        maintenance._id
      )
        .populate(
          "resident",
          "name email phone flatNo"
        )
        .populate(
          "complaint",
          "subject description category status"
        );

    return res.status(201).json({
      success: true,
      message: "Complaint bill generated successfully",
      data: createdBill,
    });

  } catch (error) {
    console.error(
      "Generate Complaint Bill Error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate complaint bill",
    });
  }
};


const getMaintenanceInvoice = async (req, res) => {
  try {
    const { maintenanceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(maintenanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance bill ID",
      });
    }

    const maintenance = await Maintenance.findById(
      maintenanceId
    )
      .populate(
        "resident",
        "name email phone flatNo"
      )
      .populate(
        "complaint",
        "subject description category status assignedStaff"
      )
      .lean();

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance bill not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        invoiceNumber:
          maintenance.invoiceNumber ||
          `INV-${maintenance._id.toString().slice(-8).toUpperCase()}`,

        invoiceDate: maintenance.createdAt,

        dueDate: maintenance.dueDate,

        status: maintenance.status,

        amount: maintenance.amount,

        month: maintenance.month,

        source: maintenance.source,

        paidAt: maintenance.paidAt,

        transactionId:
          maintenance.transactionId || "",

        resident: maintenance.resident,

        complaint: maintenance.complaint || null,
      },
    });
  } catch (error) {
    console.error(
      "Get Maintenance Invoice Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance invoice",
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      $or: [
        { entryTime: { $ne: null } },
        { exitTime: { $ne: null } },
      ],
    })
      .populate("resident", "name flatNo")
      .populate("entryGuard", "name")
      .populate("exitGuard", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load audit logs",
    });
  }
};
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Auth.findById(req.user.id)
      .select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin profile",
    });
  }
};


const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const admin = await Auth.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

   
    if (name !== undefined && name.trim() !== "") {
      admin.name = name.trim();
    }

   
    if (phone !== undefined && phone.trim() !== "") {
      admin.phone = phone.trim();
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      data: {
        _id: admin._id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        profilePic: admin.profilePic,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error("Update Admin Profile Error:", error);

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
      message: error.message || "Failed to update admin profile",
    });
  }
};

module.exports = {
    getAdminDashboard,

    getAllComplaints,
    getAllStaff,
    assignStaffToComplaint,

    getAllResidents,
    createResident,
    getResidentById,
    updateResident,
    toggleResidentStatus,

    getAllFlats,
    getFlatById,
    createFlat,
    updateFlat,
    deleteFlat,
    getAvailableFlats,

    getAllMaintenance,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    markMaintenancePaid,
    deleteMaintenance,

    getSecurityOverview,
    getAdminSecurityLogs,

    getAdminActiveVisitors,
    getAdminEntryLogs,
    getAdminExitLogs,
    getAdminOverstayVisitors,
    searchAdminVisitors,

    getAllBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking,

    createNotice,
    getAllNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,

    createPoll,
    getAllPolls,
    getPollById,
    updatePoll,
    updatePollStatus,
    deletePoll, 

    getAllAdminStaff,
    createStaff,
    getStaffById,
    updateStaff,
    toggleStaffStatus,

    getAllGuards,
    createGuard,
    getGuardById,
    updateGuard,
    toggleGuardStatus,

    getCompletedComplaintsForAdmin,
    generateComplaintBill,
    getMaintenanceInvoice,

    getAuditLogs,
    getAdminProfile,
    updateAdminProfile
};