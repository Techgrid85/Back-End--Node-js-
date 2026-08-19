const mongoose = require("mongoose");

// A single document stores society-wide controls managed by an administrator.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    visitorRegistrationEnabled: { type: Boolean, default: true },
    visitorRequestsEnabled: { type: Boolean, default: true },
    publicMapUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
