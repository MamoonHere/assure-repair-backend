const express = require("express");
const router = express.Router();
const rbacController = require("../controllers/rbacController");
const { authenticate } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/rbacMiddleware");
const {
  validateCreateRole,
  validateUpdateRole,
  validateCreatePermission,
  validateUpdatePermission,
  validateAssignRolesToUser,
  validateAssignPermissionsToRole,
} = require("../middleware/validation");

const rbacProtection = [authenticate, requirePermission("RBAC.MANAGE")];

router.post(
  "/roles",
  rbacProtection,
  validateCreateRole,
  rbacController.createRole
);
router.put(
  "/roles/:id",
  rbacProtection,
  validateUpdateRole,
  rbacController.updateRole
);
router.get("/roles", rbacProtection, rbacController.getAllRoles);
router.get("/roles/:id", rbacProtection, rbacController.getRole);
router.delete("/roles/:id", rbacProtection, rbacController.deleteRole);

router.post(
  "/permissions",
  rbacProtection,
  validateCreatePermission,
  rbacController.createPermission
);
router.put(
  "/permissions/:id",
  rbacProtection,
  validateUpdatePermission,
  rbacController.updatePermission
);
router.get("/permissions", rbacProtection, rbacController.getAllPermissions);
router.delete(
  "/permissions/:id",
  rbacProtection,
  rbacController.deletePermission
);

router.post(
  "/users/:userId/roles",
  rbacProtection,
  validateAssignRolesToUser,
  rbacController.assignRolesToUser
);
router.get("/users/:userId/roles", rbacProtection, rbacController.getUserRoles);

router.post(
  "/roles/:roleId/permissions",
  rbacProtection,
  validateAssignPermissionsToRole,
  rbacController.assignPermissionsToRole
);

module.exports = router;

