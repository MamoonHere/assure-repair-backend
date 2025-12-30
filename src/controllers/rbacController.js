const { validationResult } = require("express-validator");
const rbacService = require("../services/rbacService");
const { sendResponse } = require("../utils/generalUtility");

exports.createRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(
        res,
        400,
        null,
        errors
          .array()
          .map((e) => e.msg)
          .join(", ")
      );
    }

    const { name, description } = req.body;
    const role = await rbacService.createRole(name, description);
    sendResponse(res, 201, role.toJSON(), "Role created successfully");
  } catch (error) {
    console.error("Create role error:", error);
    sendResponse(res, 400, null, error.message || "Failed to create role");
  }
};

exports.updateRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(
        res,
        400,
        null,
        errors
          .array()
          .map((e) => e.msg)
          .join(", ")
      );
    }

    const { id } = req.params;
    const { name, description } = req.body;
    const role = await rbacService.updateRole(id, name, description);
    sendResponse(res, 200, role.toJSON(), "Role updated successfully");
  } catch (error) {
    console.error("Update role error:", error);
    sendResponse(res, 400, null, error.message || "Failed to update role");
  }
};

exports.getRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await rbacService.getRole(id);
    sendResponse(res, 200, role, "Role retrieved successfully");
  } catch (error) {
    console.error("Get role error:", error);
    sendResponse(res, 404, null, error.message || "Role not found");
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await rbacService.getAllRoles();
    sendResponse(res, 200, roles, "Roles retrieved successfully");
  } catch (error) {
    console.error("Get all roles error:", error);
    sendResponse(res, 500, null, error.message || "Failed to retrieve roles");
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await rbacService.deleteRole(id);
    sendResponse(res, 200, null, "Role deleted successfully");
  } catch (error) {
    console.error("Delete role error:", error);
    sendResponse(res, 400, null, error.message || "Failed to delete role");
  }
};

exports.createPermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(
        res,
        400,
        null,
        errors
          .array()
          .map((e) => e.msg)
          .join(", ")
      );
    }

    const { name, description } = req.body;
    const permission = await rbacService.createPermission(name, description);
    sendResponse(
      res,
      201,
      permission.toJSON(),
      "Permission created successfully"
    );
  } catch (error) {
    console.error("Create permission error:", error);
    sendResponse(
      res,
      400,
      null,
      error.message || "Failed to create permission"
    );
  }
};

exports.updatePermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(
        res,
        400,
        null,
        errors
          .array()
          .map((e) => e.msg)
          .join(", ")
      );
    }

    const { id } = req.params;
    const { name, description } = req.body;
    const permission = await rbacService.updatePermission(
      id,
      name,
      description
    );
    sendResponse(
      res,
      200,
      permission.toJSON(),
      "Permission updated successfully"
    );
  } catch (error) {
    console.error("Update permission error:", error);
    sendResponse(
      res,
      400,
      null,
      error.message || "Failed to update permission"
    );
  }
};

exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await rbacService.getAllPermissions();
    sendResponse(res, 200, permissions, "Permissions retrieved successfully");
  } catch (error) {
    console.error("Get all permissions error:", error);
    sendResponse(
      res,
      500,
      null,
      error.message || "Failed to retrieve permissions"
    );
  }
};

exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    await rbacService.deletePermission(id);
    sendResponse(res, 200, null, "Permission deleted successfully");
  } catch (error) {
    console.error("Delete permission error:", error);
    sendResponse(
      res,
      400,
      null,
      error.message || "Failed to delete permission"
    );
  }
};

exports.assignRolesToUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(
        res,
        400,
        null,
        errors
          .array()
          .map((e) => e.msg)
          .join(", ")
      );
    }

    const { userId } = req.params;
    const { roleIds } = req.body;
    await rbacService.assignRolesToUser(userId, roleIds);
    sendResponse(res, 200, null, "Roles assigned to user successfully");
  } catch (error) {
    console.error("Assign roles to user error:", error);
    sendResponse(
      res,
      400,
      null,
      error.message || "Failed to assign roles to user"
    );
  }
};

exports.getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const roles = await rbacService.getUserRoles(userId);
    sendResponse(res, 200, roles, "User roles retrieved successfully");
  } catch (error) {
    console.error("Get user roles error:", error);
    sendResponse(
      res,
      404,
      null,
      error.message || "Failed to retrieve user roles"
    );
  }
};

exports.assignPermissionsToRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(
        res,
        400,
        null,
        errors
          .array()
          .map((e) => e.msg)
          .join(", ")
      );
    }

    const { roleId } = req.params;
    const { permissionIds } = req.body;
    await rbacService.assignPermissionsToRole(roleId, permissionIds);
    sendResponse(res, 200, null, "Permissions assigned to role successfully");
  } catch (error) {
    console.error("Assign permissions to role error:", error);
    sendResponse(
      res,
      400,
      null,
      error.message || "Failed to assign permissions to role"
    );
  }
};
