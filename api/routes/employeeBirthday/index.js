const express = require("express");
const router = express.Router();
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.get("/details",auth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const usersImg = await Image.find({});
    const employees = await Employee.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          birthday: 1,
          userName: 1,
          status: 1,
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
      {
        $match: {
          status: "Active",
        },
      },
    ]);
    const todayBirthDay = [];
    const upcomingBirthDay = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    employees.forEach((employee) => {
      const user_Id = employee._id;
      const employeeImg = usersImg.find((elm) => elm.user_Id.equals(user_Id));
      const image = employeeImg
        ? { path: employeeImg.path, id: employeeImg.id }
        : "";
      const birthDate = new Date(employee.birthday);
      birthDate.setFullYear(currentYear);
      const nextBirthDate = new Date(employee.birthday);
      nextBirthDate.setFullYear(currentYear);

      nextBirthDate.setFullYear(nextBirthDate.getFullYear() + 1);
      const date = birthDate >= today ? birthDate : nextBirthDate;

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        todayBirthDay.push({
          ...employee,
          birthday: {
            thisYear: date,
            original: employee.birthday,
          },
          image,
        });
      } else {
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() + i);

          const isBirthdayForCurrentDate =
            date.getDate() === currentDate.getDate() &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear();
          if (isBirthdayForCurrentDate) {
            upcomingBirthDay.push({
              ...employee,
              birthday: {
                thisYear: date,
                original: employee.birthday,
              },
              image,
            });
          }
        }
      }
    });
    const todayBirthdays = await Promise.all(todayBirthDay);
    const upcomingBirthDays = await Promise.all(upcomingBirthDay);
    const birthData = { todayBirthdays, upcomingBirthDays };
    res.status(200).json(birthData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
