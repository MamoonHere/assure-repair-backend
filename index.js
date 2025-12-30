require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const PORT = process.env.PORT;
const { connectDB } = require("./src/config/database");
const websocketService = require("./src/services/websocketService");

connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

const server = http.createServer(app);
websocketService.initializeSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized and ready for connections`);
});
