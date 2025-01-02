const express = require("express");
const router = express.Router();
const Image = require("../../../models/image");
const Employee = require("../../../models/employee");
const Termination = require("../../../models/termination");
const auth = require('../../helpers/auth')

router.post("/add-termination",auth, async (req, res) => {
  try {
    const { terminatedEmployee, reason, terminatedDate } = req.body;
    const newTermination = new Termination({
      terminatedEmployee,
      reason,
      terminatedDate,
    });
    await newTermination.save();
    res.status(201).json({ message: "Termination added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/details",auth, async (req, res) => {
  try {
    const terminationDetails = await Termination.find({})
      .populate({
        path: "terminatedEmployee",
      });
    res.status(200).json(terminationDetails);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update-details",auth, async (req, res) => {
  try {
    const updatedFields = req.body;
    await Termination.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send("Detail updated successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/delete/:id",auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Termination.deleteOne({ _id: id });
    res.status(200).send({ message: "Details deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
