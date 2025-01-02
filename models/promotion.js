const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
  promotedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  promotionDate: {
    type: Date,
    required: true,
  },
});

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
