const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const routs = require("./api/router");
const config = require("./config");
let { PRODUCTION_PORT } = config;
const PORT = PRODUCTION_PORT || 9000;
const swaggerDocs = require("./api/swagger/swagger");
const Leaves = require("./models/onLeaveToday");
// const path = require("path");
// const fileUpload = require("express-fileupload");
app.use(cors());
app.use(express.json());
// app.use(fileUpload());
// Database connection
require("./db/connection");

app.get("/api/testing", async (req, res) => {
  res.send("Working 0.5");
});

// Authentication routes
// app.use("/api", routs);
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}, routs);
// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.static("../public"));
// app.use("/public", express.static("./public"));
app.use("/uploads", express.static("./uploads"));
// async function updateSpecificLeaveRecord() {
//   const targetId = "686ce04c632cffa96e565e3c";
//   const newCreatedAtDate = "2025-01-27";

//   try {
//     const updateResult = await Leaves.collection.updateOne(
//       { _id: new mongoose.Types.ObjectId(targetId) }, 
//       { $set: { createdAt: new Date(newCreatedAtDate) } }
//     );

//     if (updateResult.matchedCount === 0) {
//       console.log(`⚠️ Record with ID ${targetId} not found.`);
//     } else if (updateResult.modifiedCount === 0) {
//       console.log(`📝 Record with ID ${targetId} already had createdAt set to ${newCreatedAtDate}. No change made.`);
//     } else {
//       console.log(`✅ Successfully updated record ID ${targetId}. New createdAt: ${newCreatedAtDate}`);
//     }
//   } catch (err) {
//     console.error(`❌ Error updating record ID ${targetId}:`, err);
//   }
// }

// Run the one-time update function
// updateSpecificLeaveRecord();
// async function removeDuplicates() {
//   try {
//     const duplicates = await Leaves.aggregate([
//       {
//         $group: {
//           _id: { employee: "$employee", startDate: "$startDate", endDate: "$endDate", leaveType: "$leaveType" },
//           ids: { $addToSet: "$_id" },
//           count: { $sum: 1 }
//         }
//       },
//       { $match: { count: { $gt: 1 } } }
//     ]);

//     for (const dup of duplicates) {
//       const [keep, ...remove] = dup.ids;
//       await Leaves.deleteMany({ _id: { $in: remove } });
//     }

//     console.log("Duplicate leaves removed!");}catch(e){
//  console.error(error);
//     }}
//     removeDuplicates();

app.listen(PORT, () => {
  console.log("Server is running..." + PORT);
  swaggerDocs(app, PORT);
});





