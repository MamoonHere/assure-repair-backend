const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const vehicleController = require("../controllers/vehicleController");

router.get("/", authenticate, vehicleController.getAllVehicles);

module.exports = router;
