const BOUNCIE_WEBHOOK_KEY = process.env.BOUNCIE_WEBHOOK_KEY;

exports.validateWebhookAuth = async (authHeader) => {
  if (!authHeader) {
    return false;
  }
  return authHeader === BOUNCIE_WEBHOOK_KEY;
};

exports.processWebhook = async (payload) => {
  console.log('Received Bouncie webhook:', {
    eventType: payload.type || payload.event_type || 'unknown',
    timestamp: new Date().toISOString(),
    payload: payload
  });

  switch (payload.type || payload.event_type) {
    case 'tripData':
      await handleTripData(payload);
      break;
    case 'tripStart':
      await handleTripStart(payload);
      break;
    case 'tripEnd':
      await handleTripEnd(payload);
      break;
    case 'tripMetrics':
      await handleTripMetrics(payload);
      break;
    case 'deviceConnect':
      await handleDeviceConnect(payload);
      break;
    case 'deviceDisconnect':
      await handleDeviceDisconnect(payload);
      break;
    case 'battery':
      await handleBattery(payload);
      break;
    case 'mil':
      await handleMIL(payload);
      break;
    case 'vinChange':
      await handleVinChange(payload);
      break;
    case 'applicationGeozone':
      await handleApplicationGeozone(payload);
      break;
    case 'userGeozone':
      await handleUserGeozone(payload);
      break;
    default:
      console.log('Unknown webhook event type:', payload.type || payload.event_type);
  }

  return { success: true };
};

async function handleTripData(payload) {
  console.log('Processing trip data:', {
    vehicleId: payload.vehicle_id || payload.vehicleId,
    location: payload.location,
    coordinates: payload.coordinates,
    speed: payload.speed,
    heading: payload.heading,
    timestamp: payload.timestamp
  });
}

async function handleTripStart(payload) {
  console.log('Trip started:', {
    vehicleId: payload.vehicle_id || payload.vehicleId,
    timestamp: payload.timestamp
  });
}

async function handleTripEnd(payload) {
  console.log('Trip ended:', {
    vehicleId: payload.vehicle_id || payload.vehicleId,
    timestamp: payload.timestamp
  });
}

async function handleTripMetrics(payload) {
  console.log('Trip metrics:', payload);
}

async function handleDeviceConnect(payload) {
  console.log('Device connected:', payload);
}

async function handleDeviceDisconnect(payload) {
  console.log('Device disconnected:', payload);
}

async function handleBattery(payload) {
  console.log('Battery event:', payload);
}

async function handleMIL(payload) {
  console.log('MIL (Check Engine) event:', payload);
}

async function handleVinChange(payload) {
  console.log('VIN change event:', payload);
}

async function handleApplicationGeozone(payload) {
  console.log('Application geozone event:', payload);
}

async function handleUserGeozone(payload) {
  console.log('User geozone event:', payload);
}






