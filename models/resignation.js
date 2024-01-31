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
    required: true,
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
});

const Resignation = mongoose.model("Resignation", resignationSchema);

module.exports = Resignation;
