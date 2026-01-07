const express = require("express");
const cors = require("cors");
const app = express();
const routs = require("./api/router");
const config = require("./config");
let { PRODUCTION_PORT } = config;
const PORT = PRODUCTION_PORT || 9000;
const swaggerDocs = require("./api/swagger/swagger");
app.use(cors());
app.use(express.json());

require("./db/connection");

app.get("/api/testing", async (req, res) => {
  res.send("Working 0.5");
});

app.use(
  "/api",
  // (req, res, next) => {
  //   res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  //   res.setHeader("Pragma", "no-cache");
  //   res.setHeader("Expires", "0");
  //   next();
  // },
  routs
);

app.use("/uploads", express.static("./uploads"));

app.listen(PORT, () => {
  console.log("Server is running..." + PORT);
  swaggerDocs(app, PORT);
});
