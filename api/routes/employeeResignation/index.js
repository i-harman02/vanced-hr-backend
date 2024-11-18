const express = require("express");
const router = express.Router();
const Resignation = require("../../../models/resignation");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.post("/add-resignation",auth, async (req, res) => {
  try {
    const { resignationEmployee, reason, resignedDate } = req.body;
    const profile = await Image.findOne({
      user_Id: resignationEmployee,
    });
    const profileId = profile._id;
    const newResignation = new Resignation({
      resignationEmployee,
      image: profileId,
      reason,
      resignedDate,
    });
    await newResignation.save();
    res.status(201).json({ message: "Resignation Added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/resignation-details",auth, async (req, res) => {
  try {
    const resignationDetails = await Resignation.find({})
      .populate({
        path: "resignationEmployee",
        select: "userName designation employeeId firstName lastName email",
      })
      .populate({
        path: "image",
        select: "path",
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
        select: "userName designation employeeId firstName lastName email",
      })
      .populate({
        path: "image",
        select: "path",
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
