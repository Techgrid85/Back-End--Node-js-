const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    // ==========================================
    // RESIDENT WHO CREATED THE VISITOR PASS
    // ==========================================

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    // Present when this pass began as a request from a registered visitor.
    // It lets the visitor see only their own requests and approved passes.
    visitorAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
      index: true,
    },

    requestSource: {
      type: String,
      enum: ["resident", "visitor", "guard"],
      default: "resident",
      required: true,
    },

    flatNo: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // VISITOR DETAILS
    // ==========================================

    visitorName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      match: /^\d{10}$/,
    },

    visitorType: {
      type: String,
      enum: ["Guest", "Delivery", "Cab", "Vendor"],
      default: "Guest",
      required: true,
    },

    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    // ==========================================
    // DIGITAL GATE PASS
    // ==========================================

    gateKey: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    // ==========================================
    // PLANNED VISIT TIME
    // ==========================================

    visitDate: {
      type: Date,
      required: true,
    },

    visitStartTime: {
      type: Date,
      required: true,
    },

    visitEndTime: {
      type: Date,
      required: true,
    },

    // ==========================================
    // OVERSTAY
    // ==========================================

    isOverstay: {
      type: Boolean,
      default: false,
    },

    overstayMinutes: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // APPROVAL STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Completed",
        "Revoked",
      ],
      default: "Pending",
    },

    // ==========================================
    // GATE ENTRY / EXIT
    // ==========================================

    gateStatus: {
      type: String,
      enum: ["Not Entered", "Inside", "Exited"],
      default: "Not Entered",
    },

    entryTime: {
      type: Date,
      default: null,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    entryGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },

    exitGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },

    // ==========================================
    // WALK-IN VISITOR
    // ==========================================

    isWalkIn: {
      type: Boolean,
      default: false,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// VALIDATE VISIT TIME
// ==========================================

visitorSchema.pre("validate", function () {
  if (
    this.visitStartTime &&
    this.visitEndTime &&
    this.visitEndTime <= this.visitStartTime
  ) {
    throw new Error(
      "Visit end time must be later than visit start time"
    );
  }
});


const Visitor = mongoose.model(
  "Visitor",
  visitorSchema
);

module.exports = Visitor;
