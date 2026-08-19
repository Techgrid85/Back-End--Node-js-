const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", default: null },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: {
      type: String,
      enum: ["visitor", "complaint", "maintenance", "booking", "notice", "poll", "account", "system"],
      default: "system",
      index: true,
    },
    sourcePanel: { type: String, enum: ["admin", "resident", "guard", "staff", "visitor", "system"], default: "system" },
    entityType: { type: String, default: "", trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
