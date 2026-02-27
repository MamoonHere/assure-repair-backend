require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const PORT = process.env.PORT;
const { connectDB, closeDB } = require("./src/config/database");
const websocketService = require("./src/services/websocketService");

connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

const server = http.createServer(app);
websocketService.initializeSocketIO(server);

let isShuttingDown = false;

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");

  const io = websocketService.getIO();
  io.close(() => {
    server.close(() => {
      closeDB()
        .then(() => {
          console.log("Graceful shutdown complete");
          process.exit(0);
        })
        .catch((err) => {
          console.error("Error closing database:", err);
          process.exit(1);
        });
    });
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized and ready for connections`);
});
