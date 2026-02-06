const express = require("express");
const router = express.Router();
const Employee = require("../../../models/employee");
const AppraisalCycle = require("../../../models/appraisalCycle");
const auth = require('../../helpers/auth');

// Add new appraisal cycle
router.post("/add", auth, async (req, res) => {
  try {
    const { cycleName, reviewPeriod, employee, startDate, endDate, status } = req.body;
    const newAppraisal = new AppraisalCycle({
      cycleName,
      reviewPeriod,
      employee,
      startDate,
      endDate,
      status: status || "Active"
    });
    await newAppraisal.save();
    res.status(201).json({ message: "Appraisal added successfully", appraisal: newAppraisal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all appraisal cycles
router.get("/all", auth, async (req, res) => {
  try {
    const appraisals = await AppraisalCycle.find().populate("employee", "name lastName dateOfJoining");
    res.status(200).json(appraisals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update appraisal cycle
router.put("/update/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AppraisalCycle.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: "Appraisal updated successfully", appraisal: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete appraisal cycle
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await AppraisalCycle.findByIdAndDelete(id);
    res.status(200).json({ message: "Appraisal deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Legacy details endpoint (optional to keep)
router.get("/details", auth, async (req, res) => {
  try {
    const employee = await Employee.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          name: 1,
          appraisalDate: 1,
          dateOfJoining: 1,
          userName: 1,
          status: 1,
        },
      },
      {
        $match: {
          status: "Active",
        },
      },
    ]);
    res.status(200).json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
