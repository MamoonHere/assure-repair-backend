const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const rbacService = require("./rbacService");
const {
  generateAccessToken,
  getTokenExpiry,
  getUserById,
  verifyAccessToken,
} = require("../utils/generalUtility");

const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY;

exports.login = async (email, password) => {
  const user = await User.findByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  if (!user.password) {
    throw new Error(
      "Password not set. Please set your password using the link sent to your email."
    );
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }
  const { roles, permissions } = await rbacService.getUserRolesAndPermissions(
    user.id
  );
  const accessToken = generateAccessToken(user.id.toString());
  const refreshTokenValue = RefreshToken.generateToken();
  const expiresAt = getTokenExpiry(REFRESH_TOKEN_EXPIRY);
  const refreshTokenDoc = await RefreshToken.create(
    refreshTokenValue,
    user.id,
    expiresAt
  );
  await user.updateLastLogin();
  return {
    user: {
      ...user.toSafeObject(),
      roles,
      permissions,
    },
    accessToken,
    refreshToken: refreshTokenValue,
    expiresAt: refreshTokenDoc.expiresAt,
  };
};

exports.refreshAccessToken = async (refreshTokenValue) => {
  const refreshTokenDoc = await RefreshToken.findByToken(refreshTokenValue);
  if (!refreshTokenDoc || !refreshTokenDoc.isValid()) {
    throw new Error("Invalid or expired refresh token");
  }
  await refreshTokenDoc.delete();
  const user = await User.findById(refreshTokenDoc.userId);
  if (!user) {
    throw new Error("User not found");
  }
  const { roles, permissions } = await rbacService.getUserRolesAndPermissions(
    refreshTokenDoc.userId
  );
  const newAccessToken = generateAccessToken(refreshTokenDoc.userId.toString());
  const newRefreshTokenValue = RefreshToken.generateToken();
  const newExpiresAt = getTokenExpiry(REFRESH_TOKEN_EXPIRY);
  const newRefreshTokenDoc = await RefreshToken.create(
    newRefreshTokenValue,
    refreshTokenDoc.userId,
    newExpiresAt
  );
  return {
    user: {
      ...user.toSafeObject(),
      roles,
      permissions,
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenValue,
    expiresAt: newRefreshTokenDoc.expiresAt,
  };
};

exports.logout = async (refreshTokenValue) => {
  const refreshTokenDoc = await RefreshToken.findByToken(refreshTokenValue);
  if (refreshTokenDoc) {
    await refreshTokenDoc.delete();
  }
  return { success: true };
};

exports.logoutAll = async (userId) => {
  await RefreshToken.deleteAllByUser(userId);
  return { success: true };
};

exports.getUserById = getUserById;
exports.verifyAccessToken = verifyAccessToken;
