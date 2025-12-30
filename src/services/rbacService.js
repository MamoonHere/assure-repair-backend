const Role = require("../models/Role");
const Permission = require("../models/Permission");
const User = require("../models/User");
const { getPool } = require("../config/database");

exports.getUserRolesAndPermissions = async (userId) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 
      r.id as role_id,
      r.name as role_name,
      p.id as permission_id,
      p.name as permission_name
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.id
    INNER JOIN role_permissions rp ON r.id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = $1`,
    [userId]
  );

  const roles = new Set();
  const permissions = new Set();
  result.rows.forEach((row) => {
    roles.add(row.role_name);
    permissions.add(row.permission_name);
  });
  return {
    roles: Array.from(roles),
    permissions: Array.from(permissions),
  };
};

exports.createRole = async (name, description = null) => {
  if (!name || name.trim().length === 0) {
    throw new Error("Role name is required");
  }
  const normalizedName = name.trim().toUpperCase();
  if (!/^[A-Z0-9._]+$/.test(normalizedName)) {
    throw new Error(
      "Role name can only contain uppercase letters, numbers, underscores, and periods"
    );
  }
  const existingRole = await Role.findByName(normalizedName);
  if (existingRole) {
    throw new Error("Role with this name already exists");
  }
  return await Role.create(normalizedName, description);
};

exports.updateRole = async (roleId, name, description = null) => {
  const role = await Role.findById(roleId);
  if (!role) {
    throw new Error("Role not found");
  }
  if (!name || name.trim().length === 0) {
    throw new Error("Role name is required");
  }
  const normalizedName = name.trim().toUpperCase();
  if (!/^[A-Z0-9._]+$/.test(normalizedName)) {
    throw new Error(
      "Role name can only contain uppercase letters, numbers, underscores, and periods"
    );
  }
  if (normalizedName !== role.name) {
    const existingRole = await Role.findByName(normalizedName);
    if (existingRole) {
      throw new Error("Role with this name already exists");
    }
  }
  return await role.update(normalizedName, description);
};

exports.getRole = async (roleId) => {
  const role = await Role.findById(roleId);
  if (!role) {
    throw new Error("Role not found");
  }
  const permissions = await role.getPermissions();
  return {
    ...role.toJSON(),
    permissions,
  };
};

exports.getAllRoles = async () => {
  const roles = await Role.findAll();
  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const permissions = await role.getPermissions();
      return {
        ...role.toJSON(),
        permissions,
      };
    })
  );
  return rolesWithPermissions;
};

exports.deleteRole = async (roleId) => {
  const role = await Role.findById(roleId);
  if (!role) {
    throw new Error("Role not found");
  }
  if (role.name === "SUPER_ADMIN") {
    throw new Error("Cannot delete SUPER_ADMIN role");
  }
  await role.delete();
  return { success: true };
};

exports.createPermission = async (name, description = null) => {
  if (!name || name.trim().length === 0) {
    throw new Error("Permission name is required");
  }
  const normalizedName = name.trim().toUpperCase();
  if (!/^[A-Z0-9._]+$/.test(normalizedName)) {
    throw new Error(
      "Permission name can only contain uppercase letters, numbers, underscores, and periods"
    );
  }
  const existingPermission = await Permission.findByName(normalizedName);
  if (existingPermission) {
    throw new Error("Permission with this name already exists");
  }
  return await Permission.create(normalizedName, description);
};

exports.updatePermission = async (permissionId, name, description = null) => {
  const permission = await Permission.findById(permissionId);
  if (!permission) {
    throw new Error("Permission not found");
  }
  if (!name || name.trim().length === 0) {
    throw new Error("Permission name is required");
  }
  const normalizedName = name.trim().toUpperCase();
  if (!/^[A-Z0-9._]+$/.test(normalizedName)) {
    throw new Error(
      "Permission name can only contain uppercase letters, numbers, underscores, and periods"
    );
  }
  if (normalizedName !== permission.name) {
    const existingPermission = await Permission.findByName(normalizedName);
    if (existingPermission) {
      throw new Error("Permission with this name already exists");
    }
  }
  return await permission.update(normalizedName, description);
};

exports.getAllPermissions = async () => {
  return await Permission.findAll();
};

exports.deletePermission = async (permissionId) => {
  const permission = await Permission.findById(permissionId);
  if (!permission) {
    throw new Error("Permission not found");
  }
  await permission.delete();
  return { success: true };
};

exports.assignRolesToUser = async (userId, roleIds) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (!Array.isArray(roleIds) || roleIds.length === 0) {
    throw new Error("Role IDs must be a non-empty array");
  }
  const pool = getPool();
  const roleCheck = await pool.query(
    `SELECT id FROM roles WHERE id = ANY($1::int[])`,
    [roleIds]
  );
  if (roleCheck.rows.length !== roleIds.length) {
    throw new Error("One or more roles not found");
  }
  await pool.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
  if (roleIds.length > 0) {
    const values = roleIds.map((_, index) => `($1, $${index + 2})`).join(", ");
    const query = `INSERT INTO user_roles (user_id, role_id) VALUES ${values}`;
    await pool.query(query, [userId, ...roleIds]);
  }
  return { success: true };
};

exports.getUserRoles = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const pool = getPool();
  const result = await pool.query(
    `SELECT r.* FROM roles r
     INNER JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = $1
     ORDER BY r.name`,
    [userId]
  );
  return result.rows;
};

exports.assignPermissionsToRole = async (roleId, permissionIds) => {
  const role = await Role.findById(roleId);
  if (!role) {
    throw new Error("Role not found");
  }
  if (!Array.isArray(permissionIds)) {
    throw new Error("Permission IDs must be an array");
  }
  if (permissionIds.length > 0) {
    const pool = getPool();
    const permCheck = await pool.query(
      `SELECT id FROM permissions WHERE id = ANY($1::int[])`,
      [permissionIds]
    );
    if (permCheck.rows.length !== permissionIds.length) {
      throw new Error("One or more permissions not found");
    }
  }
  await role.setPermissions(permissionIds);
  return { success: true };
};
