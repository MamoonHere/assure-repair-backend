const axios = require('axios');
const K = require("../constants/constants")

const BOUNCIE_URL = process.env.BOUNCIE_URL;
const BOUNCIE_CLIENT_ID = process.env.BOUNCIE_CLIENT_ID;
const BOUNCIE_CLIENT_SECRET = process.env.BOUNCIE_CLIENT_SECRET;
const BOUNCIE_AUTHORIZATION_KEY = process.env.BOUNCIE_AUTHORIZATION_KEY;
const BOUNCIE_AUTH_URL = process.env.BOUNCIE_AUTH_URL
const APPLICATION_HOST = process.env.APPLICATION_HOST

exports.getAllVehicles = async () => {
  try {
    const authResponse = await axios.post(
      BOUNCIE_AUTH_URL,
      {
        grant_type: 'authorization_code',
        client_id: BOUNCIE_CLIENT_ID,
        client_secret: BOUNCIE_CLIENT_SECRET,
        code: BOUNCIE_AUTHORIZATION_KEY,
        redirect_uri: APPLICATION_HOST
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token } = authResponse.data;
    const response = await axios.get(BOUNCIE_URL + K.GetAllVehicles, {
      headers: {
        'Authorization': `${access_token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vehicles from Bouncie API:', error.message);
    throw new Error('Failed to fetch vehicles');
  }
};