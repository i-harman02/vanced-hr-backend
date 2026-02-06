const express = require("express");
const router = express.Router();
const Resignation = require("../../../models/resignation");
const Image = require("../../../models/image");
const Employee = require("../../../models/employee");
const auth = require('../../helpers/auth')

router.post("/add-resignation",auth, async (req, res) => {
  try {
    const { resignationEmployee, reason, resignedDate, noticePeriod } = req.body;
  
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
      noticePeriod: noticePeriod || 45,
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

router.get("/resignation-details", auth, async (req, res) => {
  try {
    if (!req.user && res.locals.decode) req.user = res.locals.decode;
    const loggedInUser = await Employee.findById(req.user.id).lean();
    if (!loggedInUser) return res.status(404).json({ message: "User not found" });

    const isPrivileged = loggedInUser.role === "admin" || 
                         loggedInUser.role === "superadmin" || 
                         loggedInUser.assignRole === "HR" || 
                         loggedInUser.assignRole === "HR Manager" ||
                         loggedInUser.assignRole === "Manager";

    let query = {};
    if (!isPrivileged) {
      // Regular employees and TLs (unless TL is considered privileged, but user specifically said Manager) 
      // see only their own or their team's. 
      // For now, let's stick to 'Managers and above see all'.
      // If not privileged, filter by employee ID
      query.resignationEmployee = loggedInUser._id;
    }

    const resignationDetails = await Resignation.find(query)
      .populate({
        path: "resignationEmployee",
        select: "name lastName designation profileImage employeeId"
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
        path: "resignationEmployee",
        select: "name lastName designation profileImage employeeId"
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

router.put("/resignation-status-update", auth, async (req, res) => {
  try {
    const { status, id } = req.body;
    const updatedFields = { status };
    
    if (status === "Approved") {
      updatedFields.approvedDate = new Date();
    }
    
    await Resignation.findByIdAndUpdate(
      { _id: id },
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
