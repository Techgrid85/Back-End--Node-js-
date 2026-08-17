const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/connectdb");
const authRouter = require("./Routes/authRoutes");
const adminroutes = require("./Routes/adminRouter.js");
const residentroutes = require("./Routes/residentRouter.js");
const guardroutes = require("./Routes/guardRouter.js");
const staffRoutes = require("./Routes/staffRouter.js");
dotenv.config();

const app = express();


connectDB();


app.use(cors());
app.use(express.json());
app.use(authRouter);

app.use("/admin", adminroutes);
app.use("/resident", residentroutes);
app.use("/guard", guardroutes);
app.use("/staff", staffRoutes);

app.get("/", (req, res) => {
  res.send("SmartSociety Backend is Running");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});