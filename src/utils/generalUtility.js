const jwt = require("jsonwebtoken");
const User = require("../models/User");

const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME;
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY;
const isProduction = process.env.NODE_ENV === "production";

const verifyAccessTokenValidity = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

const sendResponse = (res, status, data = null, message = null) => {
  res.status(status).json({
    data,
    message,
  });
};

const setRefreshTokenCookie = (res, token, expiresAt) => {
  let maxAge = 7 * 24 * 60 * 60;
  if (expiresAt) {
    const expiryDate =
      expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const now = new Date();
    maxAge = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
    if (maxAge < 0) maxAge = 0;
  }
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: maxAge * 1000,
    path: "/",
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: "/",
  });
};

const generateAccessToken = (userId) => {
  return jwt.sign({ userId, type: "access" }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const getTokenExpiry = (expiryString) => {
  const expiryDate = new Date();
  const match = expiryString.match(/^(\d+)([dhm])$/);

  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === "d") {
      expiryDate.setUTCDate(expiryDate.getUTCDate() + value);
    } else if (unit === "h") {
      expiryDate.setUTCHours(expiryDate.getUTCHours() + value);
    } else if (unit === "m") {
      expiryDate.setUTCMinutes(expiryDate.getUTCMinutes() + value);
    }
  } else {
    expiryDate.setUTCDate(expiryDate.getUTCDate() + 7);
  }
  return expiryDate;
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const verifyAccessToken = (token) => {
  const decoded = verifyAccessTokenValidity(token);
  return decoded;
};

module.exports = {
  sendResponse,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  generateAccessToken,
  getTokenExpiry,
  getUserById,
  verifyAccessToken,
};
