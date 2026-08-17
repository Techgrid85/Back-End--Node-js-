const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    month: {
      type: String,
      required: true,
      trim: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Paid", "Overdue"],
      default: "Pending",
    },

    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    transactionId: {
      type: String,
      default: "",
    },

    
    source: {
      type: String,
      enum: ["Normal", "Complaint"],
      default: "Normal",
    },

    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Maintenance = mongoose.model(
  "Maintenance",
  maintenanceSchema
);

module.exports = Maintenance;