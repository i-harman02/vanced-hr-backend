const express = require("express");
const auth = require("../../helpers/auth");
const Policy = require("../../../models/policy");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { description } = req.body;

    const newPolicy = new Policy({
      description,
    });

    await newPolicy.save();
    res
      .status(201)
      .json({ message: "Policy created successfully", policy: newPolicy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const policies = await Policy.findOne();
    res.status(200).json(policies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const policyId = req.params.id;
    const updatedFields = req.body;

    const updatedPolicy = await Policy.findByIdAndUpdate(
      policyId,
      updatedFields,
      { new: true }
    );

    if (!updatedPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res
      .status(200)
      .json({ message: "Policy updated successfully", policy: updatedPolicy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const policyId = req.params.id;

    const deletedPolicy = await Policy.findByIdAndDelete(policyId);

    if (!deletedPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res
      .status(200)
      .json({ message: "Policy deleted successfully", deletedPolicy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
