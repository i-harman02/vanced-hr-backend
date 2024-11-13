const mongoose = require("mongoose");
const policySchema = new mongoose.Schema(
  {
    description: {
      type: String,
    },
    heading: {
      type: String,
    },
  },
  { timestamps: true }
);
const Policy = mongoose.model("Policy", policySchema);
module.exports = Policy;
