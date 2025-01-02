const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  holidayName: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
  },
});

const Holiday = mongoose.model("Holiday", holidaySchema);

module.exports = Holiday;
