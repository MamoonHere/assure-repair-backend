let io = null;

exports.initializeSocketIO = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: [
        "https://yourfrontend.com",
        "http://localhost:5173",
        "https://capsulate-unmellifluously-dante.ngrok-free.dev",
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
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
