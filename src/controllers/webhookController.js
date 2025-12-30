const webhookService = require("../services/webhookService");
const { sendResponse } = require("../utils/generalUtility");

exports.handleBouncieWebhook = async (req, res) => {
  try {
    const authHeader =
      req.headers.authorization || req.headers["x-bouncie-authorization"];
    const isValid = await webhookService.validateWebhookAuth(authHeader);
    if (!isValid) {
      return sendResponse(res, 401, null, "Unauthorized");
    }
    await webhookService.processWebhook(req.body);
    sendResponse(res, 200, null, "Webhook processed successfully");
  } catch (error) {
    console.error("Error processing Bouncie webhook:", error);
    sendResponse(res, 500, null, error.message || "Failed to process webhook");
  }
};
