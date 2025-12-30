const User = require("../models/User");
const Role = require("../models/Role");
const PasswordResetToken = require("../models/PasswordResetToken");
const emailService = require("./emailService");
const { getPool } = require("../config/database");
const { getTokenExpiry } = require("../utils/generalUtility");

const hasSuperAdminRole = async (userId) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT r.name FROM roles r
     INNER JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = $1 AND r.name = 'SUPER_ADMIN'`,
    [userId]
  );
  return result.rows.length > 0;
};

exports.createUser = async (email, firstName, lastName) => {
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }
  const basicEmployeeRole = await Role.findByName("BASIC_EMPLOYEE");
  if (!basicEmployeeRole) {
    throw new Error(
      "BASIC_EMPLOYEE role not found. Please ensure the database is properly initialized."
    );
  }
  const user = await User.create(email, null, firstName, lastName);
  const pool = getPool();
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [user.id, basicEmployeeRole.id]
  );
  const token = PasswordResetToken.generateToken();
  const expiresAt = getTokenExpiry("24h");
  await PasswordResetToken.create(token, user.id, expiresAt);
  try {
    await emailService.sendPasswordSetEmail(email, firstName, lastName, token);
  } catch (error) {
    console.error("Failed to send password set email:", error);
  }
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
};

exports.updateUser = async (userId, firstName, lastName, email) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (await hasSuperAdminRole(userId)) {
    throw new Error("Cannot update a user with SUPER_ADMIN role");
  }
  if (email && email !== user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email is already in use by another user");
    }
  }
  await user.update(firstName, lastName, email);
  return user.toSafeObject();
};

exports.deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (await hasSuperAdminRole(userId)) {
    throw new Error("Cannot delete a user with SUPER_ADMIN role");
  }
  await user.delete();
  return { success: true };
};

exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user.toSafeObject();
};

exports.getAllUsers = async (page = 1, limit = 10) => {
  const pool = getPool();
  const offset = (page - 1) * limit;
  const countResult = await pool.query("SELECT COUNT(*) FROM users");
  const total = parseInt(countResult.rows[0].count);
  const result = await pool.query(
    `SELECT 
      u.id, 
      u.email, 
      u.first_name, 
      u.last_name, 
      u.last_login, 
      u.created_at, 
      u.updated_at,
      r.id as role_id,
      r.name as role_name,
      r.description as role_description
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const userMap = new Map();
  result.rows.forEach((row) => {
    if (!userMap.has(row.id)) {
      userMap.set(row.id, {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        lastLogin: row.last_login,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        roles: [],
      });
    }
    if (row.role_id) {
      const user = userMap.get(row.id);
      if (!user.roles.some((r) => r.id === row.role_id)) {
        user.roles.push({
          id: row.role_id,
          name: row.role_name,
          description: row.role_description,
        });
      }
    }
  });

  const users = Array.from(userMap.values());
  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.setPasswordWithToken = async (token, newPassword) => {
  const resetToken = await PasswordResetToken.findByToken(token);
  if (!resetToken) {
    throw new Error("Invalid or expired token");
  }
  if (!resetToken.isValid()) {
    throw new Error("Token has expired or has already been used");
  }
  const user = await User.findById(resetToken.userId);
  if (!user) {
    throw new Error("User not found");
  }
  await user.setPassword(newPassword);
  await resetToken.markAsUsed();
  return { success: true };
};

exports.resendPasswordSetEmail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.password) {
    throw new Error("User already has a password set");
  }
  const token = PasswordResetToken.generateToken();
  const expiresAt = getTokenExpiry("24h");
  await PasswordResetToken.create(token, user.id, expiresAt);
  try {
    await emailService.sendPasswordSetEmail(
      user.email,
      user.firstName,
      user.lastName,
      token
    );
  } catch (error) {
    console.error("Failed to send password set email:", error);
    throw new Error(
      "Failed to send email. Please check your email configuration."
    );
  }
  return { success: true };
};
