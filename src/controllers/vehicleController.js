const vehicleService = require('../services/vehicleService');
const { sendResponse } = require("../utils/generalUtility");

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    sendResponse(res, 200, vehicles, 'Vehicles retrieved successfully');
  } catch (error) {
    sendResponse(res, 500, null, error.message || 'Failed to retrieve vehicles');
  }
};
