const express = require("express");
const router = express.Router();
const Holiday = require("../../../models/holidayList");
const Image = require("../../../models/image");
const auth = require("../../helpers/auth");
const removeImage = require("../../helpers/deleteImage/deleteImage");

router.post("/list", auth, async (req, res) => {
  try {
    const { holidayName, year, startDate, endDate, description } = req.body;

    const newHoliday = new Holiday({
      holidayName,
      year,
      startDate,
      endDate,
      description,
    });
    await newHoliday.save();
    res.status(201).json({ message: "New holiday added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/get-list/:year", auth, async (req, res) => {
  try {
    const selectedYear = req.params.year;
    const image = await Image.find({});
    const currentYear = selectedYear
      ? parseInt(selectedYear, 10)
      : new Date().getFullYear();
    const holidays = await Holiday.find().sort({ year: 1, startDate: 1 });
    const holidaysByYear = [];
    holidays.forEach((holiday) => {
      const { year, holidayName, startDate, endDate, description, _id } =
        holiday;
      const img = image.find((elm) => elm.user_Id.equals(_id));
      if (currentYear === year) {
        holidaysByYear.push({
          _id,
          holidayName,
          startDate,
          endDate,
          description,
          image: img.path,
        });
      }
    });

    res.status(200).json(holidaysByYear);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const holidayId = req.params.id;
    const updatedFields = req.body;
    await Holiday.findByIdAndUpdate(
      { _id: holidayId },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: "Holiday detail updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Holiday.deleteOne({ _id: id });
    await removeImage(id);
    res.status(200).send({ message: "Holiday deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
