const mongoose = require("mongoose");

const resignationSchema = new mongoose.Schema({
  resignationEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
  },
  reason: {
    type: String,
  },
  resignedDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
  approvedDate: {
    type: Date,
  },
  noticePeriod: {
    type: Number,
    default: 45,
  },
});

const Resignation = mongoose.model("Resignation", resignationSchema);

module.exports = Resignation;
