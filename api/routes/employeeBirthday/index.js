const express = require("express");
const router = express.Router();
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.get("/details", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await Employee.aggregate([
      {
        $match: {
          status: "Active",
          birthday: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          name: 1,
          lastName: 1,
          birthday: 1,
          email: 1,
          profileImage: 1,
        },
      },
    ]);

    const todayBirthdays = [];
    const upcomingBirthDays = [];

    employees.forEach((employee) => {
      const birthDate = new Date(employee.birthday);
      if (isNaN(birthDate)) return;

      birthDate.setFullYear(currentYear);

      const nextBirthDate = new Date(birthDate);
      nextBirthDate.setFullYear(currentYear + 1);

      const date = birthDate >= today ? birthDate : nextBirthDate;

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth()
      ) {
        todayBirthdays.push({
          ...employee,
          birthday: {
            thisYear: date,
            original: employee.birthday,
          },
        });
      } else {
        for (let i = 1; i <= 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);

          if (
            date.getDate() === checkDate.getDate() &&
            date.getMonth() === checkDate.getMonth()
          ) {
            upcomingBirthDays.push({
              ...employee,
              birthday: {
                thisYear: date,
                original: employee.birthday,
              },
            });
          }
        }
      }
    });

    res.status(200).json({
      todayBirthdays,
      upcomingBirthDays,
    });
  } catch (error) {
    console.error("Birthday API Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
