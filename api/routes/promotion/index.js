const express = require("express");
const router = express.Router();
const Image = require("../../../models/image");
const Promotion = require("../../../models/promotion");
const Employee = require("../../../models/employee");
const auth = require('../../helpers/auth')

router.post("/add-promotion",auth, async (req, res) => {
  try {
    const { promotedEmployee, from, to, startDate, promotionDate } = req.body;
    const profile = await Image.findOne({
      user_Id: promotedEmployee,
    });
    const profileId = profile._id;
    const updatedFields = { designation: to };
    const newPromotion = new Promotion({
      promotedEmployee,
      image: profileId,
      from,
      to,
      startDate,
      promotionDate,
    });
    await newPromotion.save();

    await Employee.findByIdAndUpdate(
      { _id: promotedEmployee},
      { $set: updatedFields },
      { new: true, upsert: true }
    );

    res.status(201).json({ message: "Employee promoted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/details",auth, async (req, res) => {
  try {
    const promotionDetails = await Promotion.find({ })
      .populate({
        path: "promotedEmployee",
        select: "userName designation employeeId firstName lastName email",
      })
      .populate({
        path: "image",
        select: "path",
      });
    res.status(200).json(promotionDetails);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update-details",auth, async (req, res) => {
  try {
    const updatedFields = req.body;
    await Promotion.findByIdAndUpdate(
      { _id: req.body.id},
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send("Detail updated successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/delete/:id",auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Promotion.deleteOne({ _id: id });
    res.status(200).send({ message: "Details deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
