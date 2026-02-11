const express = require("express");
const router = express.Router();
const Role = require("../../models/role");
const auth = require("../helpers/auth");

// Add Role
router.post("/add", auth, async (req, res) => {
  try {
    const { roleName, description, status } = req.body;
    
    const existing = await Role.findOne({ roleName });
    if (existing) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const newRole = await Role.create({
      roleName,
      description,
      status: status || "Active"
    });

    res.status(201).json({ message: "Role added successfully", data: newRole });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get All Roles
router.get("/list", async (req, res) => {
  try {
    const list = await Role.find().sort({ roleName: 1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Update Role
router.put("/update/:id", auth, async (req, res) => {
  try {
    const updated = await Role.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json({ message: "Role updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Delete Role
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
