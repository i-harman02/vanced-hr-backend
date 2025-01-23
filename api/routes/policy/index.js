const express = require("express");
const auth = require("../../helpers/auth");
const Policy = require("../../../models/policy");
const EmployeeModel = require("../../../models/employee");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { description, heading, policyUrl } = req.body;

    const newPolicy = new Policy({
      description,
      heading,
      policyUrl,
    });

    await newPolicy.save();

    await EmployeeModel.updateMany({ acceptPolicies: false })

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
    if (!policies) {
      return res.status(200).json({ message: "No policies found", policies: [] });
    }

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
    await EmployeeModel.updateMany({ acceptPolicies: false })
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

router.post("/accept-policies/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;

    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      { _id: employeeId },
      { acceptPolicies: true },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Policy updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


module.exports = router;
