const { sendResponse } = require("../utils/generalUtility");

const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.permissions) {
        return sendResponse(
          res,
          403,
          null,
          "Access denied: No permissions found"
        );
      }
      const userPermissions = req.user.permissions;
      const requiredPermissions = Array.isArray(requiredPermission)
        ? requiredPermission
        : [requiredPermission];
      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      );
      if (!hasPermission) {
        return sendResponse(
          res,
          403,
          null,
          `Access denied: Required permission(s): ${requiredPermissions.join(", ")}`
        );
      }
      next();
    } catch (error) {
      return sendResponse(res, 500, null, error.message || "Permission check failed");
    }
  };
};

module.exports = {
  requirePermission
};


