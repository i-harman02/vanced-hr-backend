const express = require("express");
const router = express.Router();
const Employee = require("../../../models/employee");
const auth = require('../../helpers/auth')

router.get("/details",auth, async (req, res) => {
  try {
    const employee = await Employee.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          appraisalDate: 1,
          userName: 1,
          status: 1,
        },
      },
      {
        $sort: {
          appraisalDate: 1,
        },
      },
      {
        $match: {
          status: "Active",
        },
      },
    ]);
    res.status(200).json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
