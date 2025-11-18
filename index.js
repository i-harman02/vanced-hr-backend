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
app.use("/api", routs);

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.static("../public"));
// app.use("/public", express.static("./public"));
app.use("/uploads", express.static("./uploads"));
async function updateSpecificLeaveRecord() {
  const targetId = "6912c9825df2ec51967ef439";

  const newCreatedAtDate = "2025-11-11";

  try {
    const updateResult = await Leaves.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(targetId) }, // Convert string ID to ObjectId for Mongoose/MongoDB
      { $set: { createdAt: new Date(newCreatedAtDate) } }
    );

    if (updateResult.matchedCount === 0) {
      console.log(`⚠️ Record with ID ${targetId} not found.`);
    } else if (updateResult.modifiedCount === 0) {
      console.log(`📝 Record with ID ${targetId} already had createdAt set to ${newCreatedAtDate}. No change made.`);
    } else {
      console.log(`✅ Successfully updated record ID ${targetId}. New createdAt: ${newCreatedAtDate}`);
    }
  } catch (err) {
    console.error(`❌ Error updating record ID ${targetId}:`, err);
  }
}

// Run the one-time update function
updateSpecificLeaveRecord();
app.listen(PORT, () => {
  console.log("Server is running..." + PORT);
  swaggerDocs(app, PORT);
});


// const express = require("express");
// const cors = require("cors");
// const app = express();
// const routs = require("./api/router");
// const config = require("./config");
// let { PRODUCTION_PORT } = config;
// const PORT = PRODUCTION_PORT || 9000;
// const mongoose = require("mongoose");
// const Leaves = require("./models/onLeaveToday"); 
// const swaggerDocs = require("./api/swagger/swagger");

// // DB connection
// require("./db/connection");

// app.use(cors());
// app.use(express.json());

// app.get("/api/testing", async (req, res) => {
//   res.send("Working 0.5");
// });

// // Authentication routes
// app.use("/api", routs);

// // File uploads
// app.use("/uploads", express.static("./uploads"));

// /* ------------------------------------------------------------------
//    🚀 AUTO MIGRATION: Update createdAt with startDate (Sequentially)
// ------------------------------------------------------------------- */

// async function addCreatedAtFromStartDate() {
//   try {
//     // Find all records where createdAt is missing or null
//       const records = await Leaves.find({
//       $or: [
//         { createdAt: { $exists: false } },
//         { createdAt: null }
//       ]
//     }).lean();

//     console.log(`📌 Total records to update: ${records.length}`);

//     for (let i = 0; i < records.length; i++) {
//       const rec = records[i];
//       console.log(`➡️ Updating record ${i + 1}/${records.length} | ID: ${rec._id}`);

//       const startDateValue = new Date(rec.startDate);

//       await Leaves.collection.updateOne(
//         { _id: rec._id },
//         { $set: { createdAt: startDateValue } } 
//       );
//     }

//     console.log("🎉 Migration completed successfully!");
//   } catch (err) {
//     console.error("❌ Migration error:", err);
//   }
// }

// // Run once on server start
// addCreatedAtFromStartDate();


// /* ------------------------------------------------------------------
//    🚀 Start Server
// ------------------------------------------------------------------- */
// app.listen(PORT, () => {
//   console.log("Server is running..." + PORT);
//   swaggerDocs(app, PORT);
// });
