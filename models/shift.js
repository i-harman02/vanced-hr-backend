const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  shiftName: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  breakDuration: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
}, { timestamps: true });

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = Shift;
