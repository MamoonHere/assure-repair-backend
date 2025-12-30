const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/rbacMiddleware");
const {
  validateCreateUser,
  validateUpdateUser,
  validateSetPassword,
} = require("../middleware/validation");

const userProtection = [authenticate, requirePermission("USERS.MANAGE")];

router.post("/", userProtection, validateCreateUser, userController.createUser);
router.put(
  "/:id",
  userProtection,
  validateUpdateUser,
  userController.updateUser
);
router.delete("/:id", userProtection, userController.deleteUser);
router.get("/:id", userProtection, userController.getUser);
router.get("/", userProtection, userController.getAllUsers);
router.post(
  "/:id/resend-password-email",
  userProtection,
  userController.resendPasswordSetEmail
);
router.post("/set-password", validateSetPassword, userController.setPassword);

module.exports = router;
