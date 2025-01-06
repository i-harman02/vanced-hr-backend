const express = require("express");
const router = express.Router();
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.get("/details",auth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const employees = await Employee.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          dateOfJoining: 1,
          userName: 1,
          status: 1,
          profileImage: 1,
          month: { $month: "$dateOfJoining" },
          day: { $dayOfMonth: "$dateOfJoining" },
        },
      },
      {
        $sort: {
          month: 1,
          day: 1,
        },
      },
      {
        $match: {
          status: "Active",
        },
      },
    ]);
    const todayAnniversary = [];
    const upcomingAnniversary = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    employees.forEach((employee) => {
      const anniversaryDate = new Date(employee.dateOfJoining);
      anniversaryDate.setFullYear(currentYear);
      const nextAnniversary = new Date(employee.dateOfJoining);
      nextAnniversary.setFullYear(currentYear);

      nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
      const date = anniversaryDate >= today ? anniversaryDate : nextAnniversary;

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        todayAnniversary.push({
          ...employee,
          workAnniversary: {
            thisYear: date,
            original: employee.dateOfJoining,
          },
        });
      } else {
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() + i);

          const workAnniversaryForCurrentDate =
            date.getDate() === currentDate.getDate() &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear();
          if (workAnniversaryForCurrentDate) {
            upcomingAnniversary.push({
              ...employee,
              workAnniversary: {
                thisYear: date,
                original: employee.dateOfJoining,
              },
            });
          }
        }
      }
    });
    const todayWorkAnniversary = await Promise.all(todayAnniversary);
    const upcomingWorkAnniversary = await Promise.all(upcomingAnniversary);
    const birthData = { todayWorkAnniversary, upcomingWorkAnniversary };
    res.status(200).json(birthData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
