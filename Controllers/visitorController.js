const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Auth = require("../Models/authModel.js");
const Visitor = require("../Models/visitorModel.js");
const Settings = require("../Models/settingsModel.js");
const { notify } = require("../Services/notificationService.js");

const getSettings = () =>
  Settings.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

const createGateKey = async () => {
  let gateKey;
  do {
    gateKey = Math.floor(100000 + Math.random() * 900000).toString();
  } while (await Visitor.exists({ gateKey }));
  return gateKey;
};

const requestWindowIsOpen = (resident, startTime) => {
  if (!resident.visitorRequestsEnabled) return false;
  if (resident.visitorAvailabilityMode === "unavailable") {
    return !resident.visitorUnavailableUntil || resident.visitorUnavailableUntil <= new Date();
  }
  if (resident.visitorAvailabilityMode !== "scheduled") return true;

  const start = resident.visitingHours?.start || "00:00";
  const end = resident.visitingHours?.end || "23:59";
  const requested = new Date(startTime);
  const value = `${String(requested.getHours()).padStart(2, "0")}:${String(requested.getMinutes()).padStart(2, "0")}`;
  return value >= start && value <= end;
};

const registerVisitor = async (req, res) => {
  try {
    const settings = await getSettings();
    if (!settings.visitorRegistrationEnabled) {
      return res.status(403).json({ success: false, message: "Visitor registration is currently unavailable" });
    }

    const existingUser = await Auth.exists({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({ success: false, field: "email", message: "This email is already in use" });
    }

    const visitor = await Auth.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: await bcrypt.hash(req.body.password, 10),
      role: "visitor",
    });

    return res.status(201).json({
      success: true,
      message: "Visitor account created successfully. Please sign in to request a visit.",
      data: { userId: visitor._id, name: visitor.name, email: visitor.email, phone: visitor.phone, role: visitor.role },
    });
  } catch (error) {
    console.error("Visitor Registration Error:", error);
    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000 ? "This email is already in use" : "Unable to create visitor account",
    });
  }
};

const getProfile = async (req, res) => {
  const visitor = await Auth.findOne({ _id: req.user.id, role: "visitor" }).select("-password");
  if (!visitor) return res.status(404).json({ success: false, message: "Visitor account not found" });
  return res.json({ success: true, data: visitor });
};

const updateProfile = async (req, res) => {
  const visitor = await Auth.findOneAndUpdate(
    { _id: req.user.id, role: "visitor" },
    { name: req.body.name, phone: req.body.phone },
    { new: true, runValidators: true }
  ).select("-password");
  if (!visitor) return res.status(404).json({ success: false, message: "Visitor account not found" });
  return res.json({ success: true, message: "Profile updated successfully", data: visitor });
};

const deactivateProfile = async (req, res) => {
  const visitor = await Auth.findOneAndUpdate(
    { _id: req.user.id, role: "visitor" },
    { isActive: false },
    { new: true }
  );
  if (!visitor) return res.status(404).json({ success: false, message: "Visitor account not found" });
  return res.json({ success: true, message: "Visitor account deactivated successfully" });
};

const findResident = async (req, res) => {
  const flatNo = typeof req.query.flatNo === "string" ? req.query.flatNo.trim().toUpperCase() : "";
  if (!flatNo) return res.status(400).json({ success: false, field: "flatNo", message: "Enter a flat number" });

  const resident = await Auth.findOne({ role: "resident", isActive: true, flatNo })
    .select("name flatNo visitorRequestsEnabled visitorAvailabilityMode visitorUnavailableUntil visitingHours");
  if (!resident) return res.status(404).json({ success: false, message: "No active resident was found for this flat" });

  const acceptingRequests = requestWindowIsOpen(resident, new Date());
  return res.json({
    success: true,
    data: {
      _id: resident._id,
      name: resident.name,
      flatNo: resident.flatNo,
      acceptingRequests,
      availabilityMessage: acceptingRequests ? "Accepting visitor requests" : "This resident is not accepting visitor requests at the moment",
    },
  });
};

const getPublicMap = async (req, res) => {
  const settings = await getSettings();
  return res.json({ success: true, data: { publicMapUrl: settings.publicMapUrl || "" } });
};

const getPublicSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.json({
      success: true,
      data: {
        visitorRegistrationEnabled: settings.visitorRegistrationEnabled,
        visitorRequestsEnabled: settings.visitorRequestsEnabled,
      },
    });
  } catch (error) {
    console.error("Get Public Visitor Settings Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load visitor settings" });
  }
};

const createVisitRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.body.residentId)) {
      return res.status(400).json({ success: false, field: "residentId", message: "Invalid resident" });
    }
    const [settings, visitor, resident] = await Promise.all([
      getSettings(),
      Auth.findOne({ _id: req.user.id, role: "visitor", isActive: true }),
      Auth.findOne({ _id: req.body.residentId, role: "resident", isActive: true }),
    ]);
    if (!visitor) return res.status(403).json({ success: false, message: "Your visitor account is inactive" });
    if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });
    if (!settings.visitorRequestsEnabled || !requestWindowIsOpen(resident, req.body.visitStartTime)) {
      return res.status(403).json({ success: false, message: "This resident is not accepting visitor requests at the moment" });
    }

    const duplicate = await Visitor.exists({ visitorAccount: visitor._id, resident: resident._id, status: "Pending" });
    if (duplicate) return res.status(409).json({ success: false, message: "You already have a pending request for this resident" });

    const request = await Visitor.create({
      resident: resident._id,
      visitorAccount: visitor._id,
      requestSource: "visitor",
      flatNo: resident.flatNo,
      visitorName: visitor.name,
      email: visitor.email,
      phone: visitor.phone,
      visitorType: req.body.visitorType,
      vehicleNumber: req.body.vehicleNumber,
      purpose: req.body.purpose,
      gateKey: await createGateKey(),
      visitDate: req.body.visitDate,
      visitStartTime: req.body.visitStartTime,
      visitEndTime: req.body.visitEndTime,
      status: "Pending",
      gateStatus: "Not Entered",
    });

    await notify({
      recipientIds: [resident._id], actor: visitor._id, title: "New visitor request",
      message: `${visitor.name} requested a visit to Flat ${resident.flatNo}.`, type: "visitor", sourcePanel: "visitor", entityType: "Visitor", entityId: request._id,
    });

    return res.status(201).json({ success: true, message: "Visit request sent to the resident", data: request });
  } catch (error) {
    console.error("Create Visitor Request Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create visit request" });
  }
};

const getMyRequests = async (req, res) => {
  const requests = await Visitor.find({ visitorAccount: req.user.id })
    .populate("resident", "name flatNo")
    .sort({ createdAt: -1 });
  return res.json({ success: true, count: requests.length, data: requests });
};

const getMyPasses = async (req, res) => {
  const passes = await Visitor.find({ visitorAccount: req.user.id, status: "Approved" })
    .populate("resident", "name flatNo")
    .sort({ visitStartTime: -1 });
  return res.json({ success: true, count: passes.length, data: passes });
};

module.exports = {
  registerVisitor,
  getProfile,
  updateProfile,
  deactivateProfile,
  getPublicSettings,
  findResident,
  getPublicMap,
  createVisitRequest,
  getMyRequests,
  getMyPasses,
};
