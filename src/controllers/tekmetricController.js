const tekmetricService = require("../services/tekmetricService");
const { sendResponse } = require("../utils/generalUtility");

exports.getEmployees = async (req, res) => {
  try {
    const data = await tekmetricService.getEmployees();
    sendResponse(res, 200, data, "Jobs retrieved successfully");
  } catch (error) {
    sendResponse(res, 500, null, error.message || "Failed to retrieve jobs");
  }
};
