const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "resident", "guard", "staff", "visitor"],
      default: "resident",
    },

    flatNo: {
      type: String,
      required: function () {
        return this.role === "resident";
      },
      trim: true,
      uppercase: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      match: /^\d{10}$/,
    },

    profilePic: {
      type: String,
      default: "",
    },

    // ==========================================
    // OTHER RESIDENT INFORMATION
    // ==========================================

    vehicleRegistration: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyContact: {
      name: {
        type: String,
        trim: true,
        default: "",
      },

      relationship: {
        type: String,
        trim: true,
        default: "",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },

    familyDetails: {
      type: String,
      trim: true,
      default: "",
    },

    tenantDetails: {
      type: String,
      trim: true,
      default: "",
    },

    // Residents control whether authenticated visitors may send them
    // visit requests. These fields are ignored for non-resident accounts.
    visitorRequestsEnabled: {
      type: Boolean,
      default: true,
    },

    visitorAvailabilityMode: {
      type: String,
      enum: ["available", "unavailable", "scheduled"],
      default: "available",
    },

    visitorUnavailableUntil: {
      type: Date,
      default: null,
    },

    visitingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "20:00" },
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Auth = mongoose.model("Auth", authSchema);

module.exports = Auth;
