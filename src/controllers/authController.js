const { validationResult } = require("express-validator");
const authService = require("../services/authService");
const {
  sendResponse,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/generalUtility");

const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME;

exports.login = async (req, res) => {
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

    const { email, password } = req.body;
    const result = await authService.login(email, password);
    setRefreshTokenCookie(res, result.refreshToken, result.expiresAt);
    sendResponse(
      res,
      200,
      {
        user: result.user,
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    sendResponse(res, 401, null, error.message || "Authentication failed");
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      return sendResponse(res, 401, null, "Refresh token not found");
    }
    const result = await authService.refreshAccessToken(refreshToken);
    setRefreshTokenCookie(res, result.refreshToken, result.expiresAt);
    sendResponse(
      res,
      200,
      {
        user: result.user,
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    clearRefreshTokenCookie(res);
    sendResponse(res, 401, null, error.message || "Token refresh failed");
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearRefreshTokenCookie(res);
    sendResponse(res, 200, null, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    clearRefreshTokenCookie(res);
    sendResponse(res, 500, null, error.message || "Logout failed");
  }
};

exports.logoutAll = async (req, res) => {
  try {
    await authService.logoutAll(req.user?.id);
    clearRefreshTokenCookie(res);
    sendResponse(res, 200, null, "Logged out from all devices successfully");
  } catch (error) {
    console.error("Logout all error:", error);
    clearRefreshTokenCookie(res);
    sendResponse(res, 500, null, error.message || "Logout failed");
  }
};
