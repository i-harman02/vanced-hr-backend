const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema({
  designationName: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: false
  },
  status: {
    type: String,
    default: "Active"
  }
}, { timestamps: true });

module.exports = mongoose.model("Designation", designationSchema);
