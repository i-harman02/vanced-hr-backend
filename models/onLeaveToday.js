const mongoose = require("mongoose");

const onLeaveTodaySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
  durations: {
    type: String,
  },
  leaveType: {
    type: String,
    required: true,
  },
  noOfDays: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
  },
  notify: [
    {
      type: String,
    },
  ],
  approvedBy: {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    employerImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
  },
  status: {
    type: String,
    default: "Pending",
  },
});
const Leaves = mongoose.model("Leaves", onLeaveTodaySchema);

module.exports = Leaves;
