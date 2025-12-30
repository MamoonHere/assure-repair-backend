const authService = require("../services/authService");
const rbacService = require("../services/rbacService");
const { sendResponse, clearRefreshTokenCookie } = require("../utils/generalUtility");
const RefreshToken = require("../models/RefreshToken");
const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME;

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse(
        res,
        401,
        null,
        "No token provided or invalid format"
      );
    }
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      return sendResponse(res, 401, null, "Refresh token not found");
    }
    const refreshTokenDoc = await RefreshToken.findByToken(refreshToken);
    if (!refreshTokenDoc || !refreshTokenDoc.isValid()) {
      clearRefreshTokenCookie(res);
      throw new Error("Please log in again");
    }
    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);
    const user = await authService.getUserById(decoded.userId);
    const { roles, permissions } = await rbacService.getUserRolesAndPermissions(
      decoded.userId
    );

    req.user = {
      ...user,
      roles: roles || [],
      permissions: permissions || [],
    };

    next();
  } catch (error) {
    return sendResponse(
      res,
      401,
      null,
      error.message || "Invalid or expired token"
    );
  }
};

module.exports = {
  authenticate,
};
