const mongoose = require("mongoose");

const leaveBalancesSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  totalLeave: {
    type: Number,
    required: true,
  },
  paidLeave: {
    type: Number,
    required: true,
  },
  unPaidLeave: {  
    type: Number,
    required: true,
  },
  shortLeave: {
    type: Number,
    required: true,
  },
  halfDayLeave: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
});

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalancesSchema);

module.exports = LeaveBalance;
