const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { validateLogin } = require("../middleware/validation");

router.post("/login", validateLogin, authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);

module.exports = router;

