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


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


io.on("connection", (socket) => {
  const { userId, designation, tlId } = socket.handshake.auth || {};

  if (userId) {
    socket.join(userId);
    socket.join("GROUP_ALL");
    
    if (designation) {
      socket.join(designation);
      console.log(`Socket ${userId} joined designation room: ${designation}`);
    }

    // Join Team Room (TL + Subordinates)
    const teamRoom = tlId ? `TEAM_${tlId}` : `TEAM_${userId}`;
    socket.join(teamRoom);
    console.log(`Socket ${userId} joined team room: ${teamRoom}`);
    
    console.log("Socket joined rooms for user:", userId);
  }

  socket.on("joinRoom", (room) => {
    if (room) {
      socket.join(room);
      console.log(`Socket ${userId} joined custom room: ${room}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.set("io", io);


app.get("/api/testing", (req, res) => {
  res.send("Working 0.5");
});

app.use("/api", routes(io));

app.use("/uploads", express.static("./uploads"));


server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  swaggerDocs(app, PORT);
});
