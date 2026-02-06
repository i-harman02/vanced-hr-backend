const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const routes = require("./api/router");
const config = require("./config");
const swaggerDocs = require("./api/swagger/swagger");

const { PRODUCTION_PORT } = config;
const PORT = PRODUCTION_PORT || 9000;

app.use(cors());
app.use(express.json());

require("./db/connection");

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ Socket logic
io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;

  if (userId) {
    socket.join(userId);
    console.log("Socket joined room:", userId);
  }

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ✅ Make io available in routes if needed elsewhere
app.set("io", io);

// Test route
app.get("/api/testing", (req, res) => {
  res.send("Working 0.5");
});

// ✅ PASS io INTO ROUTES  ← THIS IS THE KEY FIX
app.use("/api", routes(io));

app.use("/uploads", express.static("./uploads"));

// ✅ Correct server start
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  swaggerDocs(app, PORT);
});
