const { validationResult } = require("express-validator");
const userService = require("../services/userService");
const { sendResponse } = require("../utils/generalUtility");

exports.createUser = async (req, res) => {
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

    const { email, firstName, lastName } = req.body;
    const user = await userService.createUser(email, firstName, lastName);
    sendResponse(
      res,
      201,
      user,
      "User created successfully. Password set email has been sent."
    );
  } catch (error) {
    console.error("Create user error:", error);
    sendResponse(res, 400, null, error.message || "Failed to create user");
  }
};

exports.updateUser = async (req, res) => {
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
    const { firstName, lastName, email } = req.body;
    const user = await userService.updateUser(id, firstName, lastName, email);
    sendResponse(res, 200, user, "User updated successfully");
  } catch (error) {
    console.error("Update user error:", error);
    const statusCode = error.message === "User not found" ? 404 : 400;
    sendResponse(
      res,
      statusCode,
      null,
      error.message || "Failed to update user"
    );
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    sendResponse(res, 200, null, "User deleted successfully");
  } catch (error) {
    console.error("Delete user error:", error);
    const statusCode = error.message === "User not found" ? 404 : 400;
    sendResponse(
      res,
      statusCode,
      null,
      error.message || "Failed to delete user"
    );
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    sendResponse(res, 200, user, "User retrieved successfully");
  } catch (error) {
    console.error("Get user error:", error);
    const statusCode = error.message === "User not found" ? 404 : 400;
    sendResponse(
      res,
      statusCode,
      null,
      error.message || "Failed to retrieve user"
    );
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await userService.getAllUsers(page, limit);
    sendResponse(res, 200, result, "Users retrieved successfully");
  } catch (error) {
    console.error("Get all users error:", error);
    sendResponse(res, 500, null, error.message || "Failed to retrieve users");
  }
};

exports.setPassword = async (req, res) => {
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

    const { token, password } = req.body;
    await userService.setPasswordWithToken(token, password);
    sendResponse(
      res,
      200,
      null,
      "Password set successfully. You can now log in."
    );
  } catch (error) {
    console.error("Set password error:", error);
    const statusCode =
      error.message.includes("Invalid") || error.message.includes("expired")
        ? 400
        : 500;
    sendResponse(
      res,
      statusCode,
      null,
      error.message || "Failed to set password"
    );
  }
};

exports.resendPasswordSetEmail = async (req, res) => {
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
    await userService.resendPasswordSetEmail(id);
    sendResponse(
      res,
      200,
      null,
      "Password set email has been resent successfully."
    );
  } catch (error) {
    console.error("Resend password set email error:", error);
    const statusCode = error.message === "User not found" ? 404 : 400;
    sendResponse(
      res,
      statusCode,
      null,
      error.message || "Failed to resend password set email"
    );
  }
};
