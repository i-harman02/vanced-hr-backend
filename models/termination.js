const mongoose = require("mongoose");

const terminationSchema = new mongoose.Schema({
  terminatedEmployee: {
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
  terminatedDate: {
    type: Date,
    required: true,
  },
});
const Termination = mongoose.model("Termination", terminationSchema);

module.exports = Termination;
