const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const tekmetricController = require("../controllers/tekmetricController");

router.get("/employees", authenticate, tekmetricController.getEmployees);

module.exports = router;
