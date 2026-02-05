const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String, // Full Day Leave, Half Day, etc.
      required: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    noOfDays: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
    },

    attachment: {
      type: String, 
    },

    notify: [
      {
        type: String, // emails or employee IDs
      },
    ],

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt
  }
);

module.exports = mongoose.model("Leave", leaveSchema);
