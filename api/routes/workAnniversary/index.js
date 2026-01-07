const express = require("express");
const router = express.Router();
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.get("/details", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const employees = await Employee.aggregate([
      {
        $match: {
          status: "Active",
          dateOfJoining: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          name: 1,
          lastName: 1,
          dateOfJoining: 1,
          profileImage: 1,
        },
      },
    ]);

    const todayWorkAnniversary = [];
    const upcomingWorkAnniversary = [];

    employees.forEach((emp) => {
      const joinDate = new Date(emp.dateOfJoining);
      if (isNaN(joinDate)) return;

      joinDate.setFullYear(currentYear);
      joinDate.setHours(0, 0, 0, 0);

      // 🎉 TODAY
      if (
        joinDate.getDate() === today.getDate() &&
        joinDate.getMonth() === today.getMonth()
      ) {
        const yearsCompleted =
          currentYear - new Date(emp.dateOfJoining).getFullYear();

        todayWorkAnniversary.push({
          ...emp,
          yearsCompleted,
          workAnniversary: {
            thisYear: joinDate,
            original: emp.dateOfJoining,
          },
        });
        return;
      }

      
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);

        if (
          joinDate.getDate() === checkDate.getDate() &&
          joinDate.getMonth() === checkDate.getMonth()
        ) {
          const yearsCompleted =
            currentYear - new Date(emp.dateOfJoining).getFullYear();

          upcomingWorkAnniversary.push({
            ...emp,
            yearsCompleted,
            workAnniversary: {
              thisYear: joinDate,
              original: emp.dateOfJoining,
            },
          });
          break;
        }
      }
    });

    res.status(200).json({
      todayWorkAnniversary,
      upcomingWorkAnniversary,
    });
  } catch (error) {
    console.error("Work Anniversary Error:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
