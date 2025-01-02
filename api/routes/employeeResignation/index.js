const express = require("express");
const router = express.Router();
const Resignation = require("../../../models/resignation");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.post("/add-resignation",auth, async (req, res) => {
  try {
    const { resignationEmployee, reason, resignedDate } = req.body;
  
    // Validate input
    if (!resignationEmployee || !reason || !resignedDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }
  
    // Check if a resignation already exists for the employee
    const existingResignation = await Resignation.findOne({
      resignationEmployee,
      status: { $in: ["Approved", "Pending"] },
    });
    if (existingResignation) {
      return res.status(409).json({
        message: "Resignation entry already exists for this employee",
        resignation: existingResignation, // Optional: Return the existing resignation
      });
    }
  
    // Attempt to find the employee profile (optional)
    const profile = await Image.findOne({ user_Id: resignationEmployee });
    const profileId = profile ? profile._id : null; // Handle case where profile is not found
  
    // Create a new resignation entry
    const newResignation = new Resignation({
      resignationEmployee,
      image: profileId, // May be null if no profile is found
      reason,
      resignedDate,
    });
  
    // Save the resignation
    await newResignation.save();
    res.status(201).json({ message: "Resignation added successfully" });
  } catch (error) {
    // Log the error for debugging
    console.error("Error adding resignation:", error);
  
    // Handle specific Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid data provided", details: error.errors });
    }
  
    // Handle unexpected errors
    res.status(500).json({ message: "An internal server error occurred" });
  }
  
});

router.get("/resignation-details",auth, async (req, res) => {
  try {
    const resignationDetails = await Resignation.find({})
      .populate({
        path: "resignationEmployee",
      });
    res.status(200).json(resignationDetails);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/resignation-details/:id",auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const resignationDetails = await Resignation.find({
      resignationEmployee: userId,
    })
      .populate({
        path: "resignationEmployee"
      });
    res.status(200).json(resignationDetails);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update-details",auth, async (req, res) => {
  try {
    const updatedFields = req.body;
    await Resignation.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send({ message: "Detail updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/resignation-status-update",auth, async (req, res) => {
  try {
    const status = req.body.status;
    const updatedFields = { status };
    await Resignation.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send({ message: "Detail updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/delete/:id",auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Resignation.deleteOne({ _id: id });
    res.status(200).send({ message: "Details deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
