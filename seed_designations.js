const mongoose = require("mongoose");
const Designation = require("./models/designation");
require("dotenv").config();

const oldDesignations = [
  "UI/UX Designer",
  "BDE",
  "Angular Developer",
  "Full Stack Developer",
  ".NET",
  "Frontend Developer (React)",
  "Web Designer",
  "HR",
  "MERN Stack"
];

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("Connected to database...");

    for (const name of oldDesignations) {
      const existing = await Designation.findOne({ designationName: name });
      if (!existing) {
        await Designation.create({
          designationName: name,
          department: "General",
          status: "Active"
        });
        console.log(`Added: ${name}`);
      } else {
        console.log(`Skipped (already exists): ${name}`);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
