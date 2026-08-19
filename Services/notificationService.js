const Auth = require("../Models/authModel.js");
const Notification = require("../Models/notificationModel.js");

const idsForRoles = async (roles) => {
  const users = await Auth.find({ role: { $in: roles }, isActive: true }).select("_id").lean();
  return users.map((user) => user._id);
};

const notify = async ({ recipientIds = [], includeAdmins = true, actor = null, title, message, type = "system", sourcePanel = "system", entityType = "", entityId = null }) => {
  try {
    const admins = includeAdmins ? await idsForRoles(["admin"]) : [];
    const recipients = [...new Set([...recipientIds, ...admins].filter(Boolean).map(String))];
    if (!recipients.length) return;
    await Notification.insertMany(recipients.map((recipient) => ({
      recipient,
      actor,
      title,
      message,
      type,
      sourcePanel,
      entityType,
      entityId,
    })));
  } catch (error) {
    // Notifications must not undo a successfully completed main workflow.
    console.error("Notification Error:", error.message);
  }
};

module.exports = { notify, idsForRoles };
