const axios = require("axios");
const K = require("../constants/constants");

const BOUNCIE_URL = process.env.BOUNCIE_URL;
const BOUNCIE_CLIENT_ID = process.env.BOUNCIE_CLIENT_ID;
const BOUNCIE_CLIENT_SECRET = process.env.BOUNCIE_CLIENT_SECRET;
const BOUNCIE_AUTHORIZATION_KEY = process.env.BOUNCIE_AUTHORIZATION_KEY;
const BOUNCIE_AUTH_URL = process.env.BOUNCIE_AUTH_URL;
const APPLICATION_HOST = process.env.APPLICATION_HOST;

let tokenCache = null;
let tokenFetchPromise = null;

const fetchAccessToken = async () => {
  if (tokenFetchPromise) return tokenFetchPromise;
  const promise = (async () => {
    console.log("here1",BOUNCIE_AUTHORIZATION_KEY)
    const authResponse = await axios.post(
      BOUNCIE_AUTH_URL,
      {
        grant_type: "authorization_code",
        client_id: BOUNCIE_CLIENT_ID,
        client_secret: BOUNCIE_CLIENT_SECRET,
        code: BOUNCIE_AUTHORIZATION_KEY,
        redirect_uri: APPLICATION_HOST,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    console.log("here", authResponse.data)
    tokenCache = authResponse.data.access_token;
    return tokenCache;
  })();
  tokenFetchPromise = promise;
  try {
    return await promise;
  } finally {
    tokenFetchPromise = null;
  }
};

const getAccessToken = async () => {
  if (tokenCache) return tokenCache;
  return fetchAccessToken();
};

const clearTokenCache = () => {
  tokenCache = null;
};

const isAuthError = (err) =>
  err.response?.status === 401 || err.response?.status === 403;

const withAuthRetry = async (fn) => {
  let token = await getAccessToken();
  try {
    return await fn(token);
  } catch (err) {
    if (isAuthError(err)) {
      clearTokenCache();
      token = await fetchAccessToken();
      return await fn(token);
    }
    throw err;
  }
};

exports.getAllVehicles = async () => {
  try {
    return await withAuthRetry(async (accessToken) => {
      const response = await axios.get(`${BOUNCIE_URL}${K.GetAllVehicles}`, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    });
  } catch (error) {
    console.error("Error fetching vehicles from Bouncie API:", error.message);
    throw new Error("Failed to fetch vehicles");
  }
};
