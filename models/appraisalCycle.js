const mongoose = require("mongoose");

const appraisalCycleSchema = new mongoose.Schema({
  cycleName: {
    type: String,
    required: true,
  },
  reviewPeriod: {
    type: String,
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
}, { timestamps: true });

const AppraisalCycle = mongoose.model("AppraisalCycle", appraisalCycleSchema);

module.exports = AppraisalCycle;
