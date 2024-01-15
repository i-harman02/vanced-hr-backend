const express = require("express");
const router = express.Router();
const Employee = require("../../../models/employee");

router.get("/details", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const employees = await Employee.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          birthday: 1,
          userName: 1,
          month: { $month: "$birthday" },
          day: { $dayOfMonth: "$birthday" },
        },
      },
      {
        $sort: {
          month: 1,
          day: 1,
        },
      },
    ]);
    // Update the birth year to the current year
    const updatedEmployees = employees.map((employee) => {
      const birthDate = new Date(employee.birthday);
      birthDate.setFullYear(currentYear);
      return {
        ...employee,
        birthday: birthDate,
      };
    });
    const birthdays = await Promise.all(updatedEmployees);
    res.status(200).json(birthdays);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
