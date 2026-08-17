const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    flatNo: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Maintenance",
        "Security",
        "Cleanliness",
        "Noise",
        "Parking",
        "Other",
      ],
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },

    adminRemark: {
      type: String,
      default: "",
      trim: true,
    },

    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },

    // ==========================================
    // BILLING
    // ==========================================

    billGenerated: {
      type: Boolean,
      default: false,
    },

    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model(
  "Complaint",
  complaintSchema
);

module.exports = Complaint;