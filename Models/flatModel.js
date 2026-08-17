const mongoose = require("mongoose");

const flatSchema = new mongoose.Schema(
  {
    flatNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    block: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    floor: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK", "Other"],
      default: "Other",
    },

    status: {
      type: String,
      enum: ["Occupied", "Vacant", "Maintenance"],
      default: "Vacant",
    },

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Flat = mongoose.model("Flat", flatSchema);

module.exports = Flat;