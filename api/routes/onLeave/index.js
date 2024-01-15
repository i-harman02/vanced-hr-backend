const express = require("express");
const router = express.Router();
const Leaves = require("../../../models/onLeaveToday");
const LeaveBalance = require("../../../models/leaveBalances");
const Image = require("../../../models/image");
const Employee = require("../../../models/employee");

router.post("/apply-leave", async (req, res) => {
  try {
    const {
      //userName,
      employee,
      startDate,
      endDate,
      //designation,
      leaveType,
      noOfDays,
      reason,
      notify,
      approvedBy,
      status,
      startTime,
      endTime,
      durations,
    } = req.body;

    // Check if the user already has a leave request overlapping with the new dates
    const overlappingLeaveRequest = await Leaves.findOne({
      employee,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
    const profile = await Image.findOne({
      user_Id: employee,
    });
    const profileId = profile._id;
    if (overlappingLeaveRequest) {
      return res
        .status(400)
        .json({ message: "Leave request overlaps with existing leave" });
    }

    const newLeave = new Leaves({
      //userName,
      employee,
      image: profileId,
      startDate,
      endDate,
      //designation,
      leaveType,
      noOfDays,
      reason,
      notify,
      approvedBy,
      status,
      startTime,
      endTime,
      durations,
    });

    await newLeave.save();
    res.status(201).json({ message: "Leave applied successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/on-leave", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    const employeesOnLeaveToday = await Leaves.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    })
      .populate({
        path: "image",
        select: "path",
      })
      .populate({
        path: "employee",
        select: "userName designation employeeId firstName lastName email",
      });

    res.status(200).json(employeesOnLeaveToday);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/balance/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    const leaveData = await Leaves.find({
      employee: userId,
    });
    const leavesByYear = leaveData.filter((leave) => {
      const leaveYear = new Date(leave.startDate).getFullYear();
      return leaveYear === currentYear;
    });
    const approvedLeaves = leavesByYear.filter((leave) => {
      const leaveDay = new Date(leave.startDate);
      return leaveDay <= currentDate && leave.status === "Approved";
    });
    const pendingLeaves = leavesByYear.filter((leave) => {
      const leaveDay = new Date(leave.startDate);
      return leaveDay <= currentDate && leave.status === "Pending";
    });
    const totalLeave = 12;
    const paidLeave = approvedLeaves ? approvedLeaves?.length : 0;
    const unPaidLeave = pendingLeaves ? pendingLeaves?.length : 0;
    const remainingLeave = totalLeave - paidLeave;
    const leaveBalances = {
      totalLeave,
      paidLeave,
      unPaidLeave,
      remainingLeave,
    };

    res.status(200).json(leaveBalances);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/all-leaves/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();
    const leaveData = await Leaves.find({
      employee: userId,
    })
      .populate({
        path: "approvedBy.employerImage",
        select: "path",
      })
      .populate({
        path: "approvedBy.employer",
        select: "userName designation employeeId firstName lastName",
      });
    const leavesByYear = leaveData.filter((leave) => {
      const leaveYear = new Date(leave.startDate).getFullYear();
      return leaveYear;
      //=== currentYear;
    });
    res.status(200).json(leavesByYear);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/stats/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();
    const leaveData = await Leaves.find({
      employee: userId,
    });
    const leaveStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthName = new Date(currentYear, month - 1, 1).toLocaleString(
        "default",
        { month: "long" }
      );
      const leaveDaysInMonth = leaveData
        .filter((leave) => {
          const leaveYear = new Date(leave.startDate).getFullYear();
          const leaveMonth = new Date(leave.startDate).getMonth() + 1;
          return leaveYear === currentYear && leaveMonth === month;
        })
        .reduce((totalDays, leave) => totalDays + leave.noOfDays, 0);
      return { month: monthName, leaveDays: leaveDaysInMonth, monthNo: month };
    });

    res.status(200).json(leaveStats);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
// router.get("/stats/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const currentYear = new Date().getFullYear();
//     const leaveData = await Leaves.find({
//       employee: userId,
//     });

//     const leaveStats = Array.from({ length: 12 }, (_, index) => {
//       const month = index + 1;
//       const monthName = new Date(currentYear, month - 1, 1).toLocaleString(
//         "default",
//         {
//           month: "long",
//         }
//       );
//       const leaveDaysInMonth = leaveData
//         .filter((leave) => {
//           const leaveYear = new Date(leave.startDate).getFullYear();
//           const leaveMonth = new Date(leave.startDate).getMonth() + 1;
//           return leaveYear === currentYear && leaveMonth === month;
//         })
//         .reduce((totalDays, leave) => totalDays + leave.noOfDays, 0);
//       return { month: monthName, leaveDays: leaveDaysInMonth, monthNo: month };
//     });

//     const weeksData = {};
//     leaveData.forEach((leave) => {
//       const leaveDate = new Date(leave.startDate);
//       const leaveMonth = leaveDate.getMonth() + 1;
//       const leaveYear = leaveDate.getFullYear();
//       const monthName = new Date(currentYear, leaveMonth - 1, 1).toLocaleString(
//         "default",
//         {
//           month: "long",
//         }
//       );
//       console.log(monthName, "monthName");
//       if (leaveYear === currentYear) {
//         const weekNumber = Math.ceil(leaveDate.getDate() / 7);
//         const weekKey = `Week ${weekNumber}`;
//         if (!weeksData[leaveMonth]) {
//           weeksData[leaveMonth] = {};
//         }
//         if (!weeksData[leaveMonth][weekKey]) {
//           weeksData[leaveMonth][weekKey] = 0;
//         }
//         weeksData[leaveMonth][weekKey] += leave.noOfDays;
//       }
//     });

//     res.status(200).json({ monthlyStats: leaveStats, weeklyStats: weeksData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/history/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();

    const leaveData = await Leaves.find({
      employee: userId,
    });
    const filteredLeaveData = leaveData.filter((leave) => {
      const leaveYear = new Date(leave.startDate).getFullYear();
      return leaveYear === currentYear;
    });
    const leaveHistory = filteredLeaveData.flatMap((val) => {
      const startDate = new Date(val.startDate);
      const endDate = new Date(val.endDate);
      const result = [];

      if (startDate.getTime() !== endDate.getTime()) {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          result.push({
            leaveDate: new Date(currentDate),
            leaveType: val.leaveType,
            reason: val.reason,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        result.push({
          leaveDate: new Date(startDate),
          leaveType: val.leaveType,
          reason: val.reason,
        });
      }

      return result;
    });
    leaveHistory.sort((a, b) => {
      const dateA = new Date(a.leaveDate);
      const dateB = new Date(b.leaveDate);
      return dateA - dateB;
    });

    res.status(200).json(leaveHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/requested/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const leaveData = await Leaves.find({
      notify: userId,
    })
      .populate({
        path: "employee",
        select: "userName designation employeeId firstName lastName",
      })
      .populate({
        path: "approvedBy.employer",
        select: "userName designation employeeId firstName lastName",
      })
      .populate({
        path: "approvedBy.employerImage",
        select: "path",
      })
      .populate({
        path: "image",
        select: "path",
      });
    res.status(200).json(leaveData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/all-requested-leaves", async (req, res) => {
  try {
    const leaveData = await Leaves.find({})
      .populate({
        path: "employee",
        select: "userName designation employeeId firstName lastName",
      })
      .populate({
        path: "approvedBy.employer",
        select: "userName designation employeeId firstName lastName",
      })
      .populate({
        path: "approvedBy.employerImage",
        select: "path",
      })
      .populate({
        path: "image",
        select: "path",
      });
    res.status(200).json(leaveData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/status-update", async (req, res) => {
  try {
    const userId = req.body.id;
    const employerId = req.body.employerId;
    const status = req.body.status;
    const profile = await Image.findOne({
      user_Id: employerId,
    });
    const profileId = profile._id;
    const updatedFields = {
      status,
      approvedBy: { employer: employerId, employerImage: profileId },
    };
    await Leaves.findOneAndUpdate(
      { _id: userId },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send({ message: "Leave updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
router.delete("/delete-leave:id", async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Image.deleteOne({ _id: id });
    res.status(200).send({ message: "Leave deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/update-leave", async (req, res) => {
  try {
    const updatedFields = { ...req.body, status: "Pending" };

    const overlappingLeaveRequest = await Leaves.findOne({
      employee: req.body.employee,
      _id: { $ne: req.body.id },
      startDate: { $lte: req.body.endDate },
      endDate: { $gte: req.body.startDate },
    });
    if (overlappingLeaveRequest) {
      return res
        .status(400)
        .json({ message: "Leave request overlaps with existing leave" });
    }
    await Leaves.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send({ message: "Leave detail updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/today-stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const employee = await Employee.find({});
    const leaves = await Leaves.find({
      $or: [
        {
          startDate: {
            $gte: new Date(today),
            $lt: new Date(today + "T23:59:59.999Z"),
          },
        },
        {
          endDate: {
            $gte: new Date(today),
            $lt: new Date(today + "T23:59:59.999Z"),
          },
        },
        {
          $and: [
            { startDate: { $lte: new Date(today) } },
            { endDate: { $gte: new Date(today + "T23:59:59.999Z") } },
          ],
        },
      ],
    });
    const approvedLeaves = leaves.filter((val) => val.status === "Approved");
    const pendingLeaves = leaves.filter((val) => val.status === "Pending");
    const totalEmployee = employee.length;
    const totalPresent = totalEmployee - approvedLeaves.length;
    const unplannedLeaves = 0;
    console.log(approvedLeaves.length);
    const todayLeaveStates = {
      approvedLeaves: approvedLeaves.length,
      pendingLeaves: pendingLeaves.length,
      totalEmployee,
      totalPresent,
      unplannedLeaves,
    };
    res.status(200).json(todayLeaveStates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
