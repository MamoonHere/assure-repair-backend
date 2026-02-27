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

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("CORS rejected origin:", origin, "allowed:", allowedOrigins);
        const err = new Error("Not allowed by CORS");
        err.status = 403;
        err.receivedOrigin = origin;
        err.allowedOrigins = allowedOrigins;
        callback(err);
      }
    },
    credentials: true,
  })
);

// Debug: GET /cors-check returns incoming Origin and whether it's allowed (test with curl -H "Origin: <your-frontend>" <backend>/cors-check)
app.get("/cors-check", (req, res) => {
  const origin = req.get("origin");
  res.json({
    origin: origin || "(no Origin header)",
    allowed: !origin || allowedOrigins.includes(origin),
    allowedOrigins,
  });
});

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
  const status = err.status || 500;
  const isCorsError = err.receivedOrigin !== undefined;
  const message =
    process.env.NODE_ENV === "production" && !isCorsError
      ? "Something went wrong"
      : err.message;
  const payload = { data: null, message };
  if (isCorsError && (err.receivedOrigin || err.allowedOrigins)) {
    payload.receivedOrigin = err.receivedOrigin;
    payload.allowedOrigins = err.allowedOrigins;
  }
  res.status(status).json(payload);
});

module.exports = app;
