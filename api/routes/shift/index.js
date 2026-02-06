const express = require("express");
const router = express.Router();
const Shift = require("../../../models/shift");
const auth = require("../../helpers/auth");

// Add a new shift
router.post("/add-shift", auth, async (req, res) => {
  try {
    const { employee, shiftName, startTime, breakDuration, endTime, status } = req.body;

    if (!employee || !shiftName || !startTime || !endTime) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const newShift = new Shift({
      employee,
      shiftName,
      startTime,
      breakDuration,
      endTime,
      status: status || "Active",
    });

    await newShift.save();
    res.status(201).json({ message: "Shift added successfully", shift: newShift });
  } catch (error) {
    console.error("Error adding shift:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all shifts
router.get("/all-shifts", auth, async (req, res) => {
  try {
    const shifts = await Shift.find().populate("employee", "name lastName designation department");
    res.status(200).json(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a shift
router.put("/update-shift/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedShift = await Shift.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedShift) {
      return res.status(404).json({ message: "Shift not found" });
    }
    res.status(200).json({ message: "Shift updated successfully", shift: updatedShift });
  } catch (error) {
    console.error("Error updating shift:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a shift
router.delete("/delete-shift/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedShift = await Shift.findByIdAndDelete(id);
    if (!deletedShift) {
      return res.status(404).json({ message: "Shift not found" });
    }
    res.status(200).json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
