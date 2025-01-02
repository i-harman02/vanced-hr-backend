const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  projectName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Projects",
    required: true,
  },
  comments: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const Performances = mongoose.model("Performances", performanceSchema);

module.exports = Performances;
