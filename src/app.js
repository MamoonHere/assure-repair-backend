const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const vehicleRoutes = require("./routes/vehicleRoutes");
const tekmetricRoutes = require("./routes/tekmetricRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const authRoutes = require("./routes/authRoutes");
const rbacRoutes = require("./routes/rbacRoutes");
const userRoutes = require("./routes/userRoutes");
const { sendResponse } = require("./utils/generalUtility");

const allowedOrigins = ["https://yourfrontend.com", "http://localhost:5173", "https://capsulate-unmellifluously-dante.ngrok-free.dev"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/rbac", rbacRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/tekmetric", tekmetricRoutes);
app.use("/webhooks", webhookRoutes);

app.use((_, res) => {
  sendResponse(res, 404, null, "Route not found");
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  sendResponse(
    res,
    err.status || 500,
    null,
    process.env.NODE_ENV === "production" ? "Something went wrong" : err.message
  );
});

module.exports = app;
