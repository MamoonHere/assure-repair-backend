const BOUNCIE_WEBHOOK_KEY = process.env.BOUNCIE_WEBHOOK_KEY;
const websocketService = require("./websocketService");

exports.validateWebhookAuth = async (authHeader) => {
  if (!authHeader) {
    return false;
  }
  return authHeader === BOUNCIE_WEBHOOK_KEY;
};

exports.processWebhook = async (payload) => {
  console.log("Recieved Event");
  if (payload.eventType === "tripData") {
    const tripData = {
      eventType: payload.eventType || "tripData",
      imei: payload.imei,
      vin: payload.vin,
      transactionId: payload.transactionId,
      data: payload.data,
      receivedAt: new Date().toISOString(),
    };
    try {
      websocketService.emitTripData(tripData);
    } catch (error) {
      // Don't not throw error(we still need to send 200 response to Bouncie)
      console.error("Error emitting trip data via WebSocket:", error);
    }
  }
  return { success: true };
};
