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
    const holiday = await newHoliday.save();
    res
      .status(201)
      .json({ message: "New holiday added successfully", holiday });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.get("/get-list/:year", auth, async (req, res) => {
  try {
    const selectedYear = req.params.year;
    const currentYear = selectedYear
      ? parseInt(selectedYear, 10)
      : new Date().getFullYear();

    if (isNaN(currentYear)) {
      return res.status(400).json({ error: "Invalid year parameter" });
    }

    let image;
    try {
      image = await Image.find({});
    } catch (err) {
      console.error("Error fetching images:", err);
      return res.status(500).json({ error: "Failed to fetch images" });
    }

    let holidays;
    try {
      holidays = await Holiday.find().sort({ year: 1, startDate: 1 });
    } catch (err) {
      console.error("Error fetching holidays:", err);
      return res.status(500).json({ error: "Failed to fetch holidays" });
    }

    const holidaysByYear = [];
    holidays.forEach((holiday) => {
      try {
        const { year, holidayName, startDate, endDate, description, _id } = holiday;
        const img = image.find((elm) => elm.user_Id.equals(_id));

        if (currentYear === year) {
          holidaysByYear.push({
            _id,
            holidayName,
            startDate,
            endDate,
            description,
            image: img ? img.path : null,
          });
        }
      } catch (err) {
        console.error("Error processing holiday:", err);
      }
    });

    res.status(200).json(holidaysByYear);
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
