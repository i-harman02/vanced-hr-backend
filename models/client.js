const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  mail: {
    type: String,
    required: true,
    unique: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  nationality: {
    type: String,
    default: "",
  },
  clientStatus: {
    type: String,
    enum: ["Active", "Inactive", "Pending"],
    default: "Active",
  },
}, {
  timestamps: true,
});

const Clients = mongoose.model("Clients", clientSchema);

module.exports = Clients;
