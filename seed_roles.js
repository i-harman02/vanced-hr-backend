const mongoose = require("mongoose");
const Role = require("./models/role");
require("dotenv").config();

const initialRoles = [
  { name: "Admin", desc: "Full system administration access" },
  { name: "Employee", desc: "Standard employee access for daily operational tasks" },
  { name: "Manager", desc: "Team management and reporting access" },
  { name: "TL", desc: "Team Leader level access for task distribution" },
  { name: "Intern", desc: "Limited access for training and specific tasks" },
  { name: "HR", desc: "Human resources and payroll management access" }
];

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("Connected to database...");

    for (const r of initialRoles) {
      const existing = await Role.findOne({ roleName: r.name });
      if (!existing) {
        await Role.create({
          roleName: r.name,
          description: r.desc,
          status: "Active"
        });
        console.log(`Added Role: ${r.name}`);
      } else {
        console.log(`Skipped Role (already exists): ${r.name}`);
      }
    }

    console.log("Role seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Role seeding failed:", err);
    process.exit(1);
  }
}

seed();
