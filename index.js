const express = require('express');
const cors = require('cors')
const app = express()
const routs = require("./api/router");
const config = require("./config");
let { PRODUCTION_PORT } = config;
const PORT = PRODUCTION_PORT || 9000;
const swaggerDocs = require("./api/swagger/swagger");
const path = require('path');

app.use(cors())
app.use(express.json())

// Database connection
require("./db/connection");


app.get("/api/testing", async (req, res) => { res.send("Working 0.1") });

// Authentication routes
app.use("/api", routs);

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.static("../public"));
app.use("/public", express.static("./public"));

app.listen(PORT, () => {
  console.log("Server is running..." + PORT)
  swaggerDocs(app, PORT);
})