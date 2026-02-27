const { verifyAccessToken } = require("../utils/generalUtility");

let io = null;

function getTokenFromHandshake(socket) {
  const auth = socket.handshake.auth;
  if (auth?.token) return auth.token;
  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

exports.initializeSocketIO = (server) => {
  const { Server } = require("socket.io");

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = getTokenFromHandshake(socket);
    if (!token) {
      return next(new Error("Unauthorized: no token provided"));
    }
    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Unauthorized: invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id, "userId:", socket.userId);
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call initializeSocketIO first."
    );
  }
  return io;
};

exports.emitTripData = (tripData) => {
  const socketIO = exports.getIO();
  socketIO.emit("tripData", tripData);
  console.log(
    "Trip data emitted to all connected clients:",
    tripData.transactionId
  );
};
