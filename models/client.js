const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  mail: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  aboutUs: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  socialMedia: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
});

const Clients = mongoose.model("Clients", clientSchema);

module.exports = Clients;
