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
      enum: ["admin", "resident", "guard", "staff"],
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