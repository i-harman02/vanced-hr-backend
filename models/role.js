const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: false
  },
  status: {
    type: String,
    default: "Active"
  }
}, { timestamps: true });

module.exports = mongoose.model("Role", roleSchema);
