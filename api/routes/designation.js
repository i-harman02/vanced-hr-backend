const express = require("express");
const router = express.Router();
const Designation = require("../../models/designation");
const auth = require("../helpers/auth");

// Add Designation
router.post("/add", auth, async (req, res) => {
  try {
    const { designationName, department, status } = req.body;
    
    const existing = await Designation.findOne({ designationName });
    if (existing) {
      return res.status(400).json({ message: "Designation already exists" });
    }

    const newDesignation = await Designation.create({
      designationName,
      department,
      status: status || "Active"
    });

    res.status(201).json({ message: "Designation added successfully", data: newDesignation });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get All Designations
router.get("/list", async (req, res) => {
  try {
    const list = await Designation.find().sort({ designationName: 1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Update Designation
router.put("/update/:id", auth, async (req, res) => {
  try {
    const updated = await Designation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json({ message: "Updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Delete Designation
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    await Designation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
