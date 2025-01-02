const express = require("express");
const router = express.Router();
const Performance = require("../../../models/performance");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.post("/add-performance",auth, async (req, res) => {
  try {
    const { employee, addedBy, projectName, comments, date } = req.body;
    const newComment = new Performance({
      employee,
      addedBy,
      projectName,
      comments,
      date,
    });
  
    await newComment.save();
    res.status(201).json({ message: "Performance added successfully" });
  } catch (error) {
    console.error("Error adding performance:", error);
    res.status(500).json({ 
      message: "Something went wrong while adding performance", 
      error: error.message 
    });
  }
  
});

router.get("/all-performance",auth, async (req, res) => {
  try {
    const feedback = await Performance.find({})
      .populate({
        path: "employee",
        select: "userName designation employeeId firstName lastName profileImage",
      })
      .populate({
        path: "addedBy",
        select: "userName designation employeeId firstName lastName profileImage",
      })
      .populate({
        path: "projectName",
        select: "projectName",
      });
    res.status(200).json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/employee-performance/:id",auth, async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Performance.find({ employee: id })
      .populate({
        path: "employee",
        select: "userName designation employeeId firstName lastName profileImage",
      })
      .populate({
        path: "addedBy",
        select: "userName designation employeeId firstName lastName profileImage",
      })
      .populate({
        path: "projectName",
        select: "projectName",
      });
    res.status(200).json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/update-performance",auth, async (req, res) => {
  try {
    const updatedFields = req.body;
    await Performance.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send({message: "Performance detail updated successfully!"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/delete/:id",auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Performance.deleteOne({ _id: id });
    res
      .status(200)
      .send({ message: "Performance deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
