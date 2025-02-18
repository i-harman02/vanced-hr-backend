const express = require("express");
const router = express.Router();
const Leaves = require("../../../models/onLeaveToday");
const LeaveBalance = require("../../../models/leaveBalances");
const Image = require("../../../models/image");
const Employee = require("../../../models/employee");
const auth = require("../../helpers/auth");
const calculateShortLeave = require("../../helpers/calculateShortLeaves");
//const nodemailer = require("nodemailer");

router.post("/apply-leave", auth, async (req, res) => {
  try {
    const {
      employee,
      startDate,
      endDate,
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
    if (overlappingLeaveRequest) {
      return res
        .status(400)
        .json({ message: "Leave request overlaps with existing leave" });
    }
   
    let findManager = await Employee.findOne({ role: "manager"});
    
    const newLeave = new Leaves({
      employee,
      startDate,
      endDate,
      leaveType,
      noOfDays,
      reason,
      notify : findManager ? [...notify, findManager._id] : notify,
      approvedBy,
      status,
      startTime,
      endTime,
      durations,
    });

    await newLeave.save();

    // const transporter = nodemailer.createTransport({
    //   // Configure your email transport settings here
    //   // Example using Gmail (you can use other email services or SMTP servers)
    //   service: "Gmail",
    //   auth: {
    //     user: "YourName@gmail.com",
    //     pass: "Your password",
    //   },
    // });
    // const mailOptions = {
    //   from: "YourName@gmail.com",
    //   to: "email",
    //   subject: "Leave Information",
    //   text: `Leave applied ${leaveType} and ${reason}`,
    // };
    // await transporter.sendMail(mailOptions);
    res.status(201).json({ message: "Leave applied successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/on-leave", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    const employeesOnLeaveToday = await Leaves.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).populate({
      path: "employee",
      select:
        "userName designation employeeId firstName lastName email personalInformation.telephones address profileImage",
    });

    res.status(200).json(employeesOnLeaveToday);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// router.get("/balance/:id", auth, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const currentYear = new Date().getFullYear();
//     const currentDate = new Date();
//     const leaveData = await Leaves.find({
//       employee: userId,
//     });
//     const leavesByYear = leaveData.filter((leave) => {
//       const leaveYear = new Date(leave.startDate).getFullYear();
//       return leaveYear === currentYear;
//     });
//     const approvedLeaves = leavesByYear.filter((leave) => {
//       const leaveDay = new Date(leave.startDate);
//       return (
//         leaveDay <= currentDate &&
//         leave.status === "Approved" &&
//         leave.leaveType === "FULL_DAY_LEAVE"
//       );
//     });
//     const approvedHalfDaysLeaves = leavesByYear.filter((leave) => {
//       const leaveDay = new Date(leave.startDate);
//       return (
//         leaveDay <= currentDate &&
//         leave.status === "Approved" &&
//         leave.leaveType === "HALF_DAY_LEAVE"
//       );
//     });

//     const approvedShortLeaves = leavesByYear.filter((leave) => {
//       const leaveDay = new Date(leave.startDate);
//       return (
//         leaveDay <= currentDate &&
//         leave.status === "Approved" &&
//         leave.leaveType === "SHORT_LEAVE"
//       );
//     });

//     const pendingLeaves = leavesByYear.filter((leave) => {
//       const leaveDay = new Date(leave.startDate);
//       return (
//         leaveDay <= currentDate &&
//         leave.status === "Pending" &&
//         leave.leaveType === "FULL_DAY_LEAVE"
//       );
//     });
//     const pendingHalfDayLeaves = leavesByYear.filter((leave) => {
//       const leaveDay = new Date(leave.startDate);
//       return (
//         leaveDay <= currentDate &&
//         leave.status === "Pending" &&
//         leave.leaveType === "HALF_DAY_LEAVE"
//       );
//     });
//     const pendingShortLeaves = leavesByYear.filter((leave) => {
//       const leaveDay = new Date(leave.startDate);
//       return (
//         leaveDay <= currentDate &&
//         leave.status === "Pending" &&
//         leave.leaveType === "SHORT_LEAVE"
//       );
//     });
//     let allLeaves = 0;
//     approvedLeaves.forEach((val) => {
//       allLeaves += val.noOfDays;
//     });
//     approvedHalfDaysLeaves.forEach((val) => {
//       allLeaves += 0.5;
//     });

//     let allUnpaidLeaves = 0;
//     pendingLeaves.forEach((val) => {
//       allUnpaidLeaves += val.noOfDays;
//     });
//     pendingHalfDayLeaves.forEach((val) => {
//       allUnpaidLeaves += 0.5;
//     });

//     allLeaves += await calculateShortLeave(approvedShortLeaves);
//     allUnpaidLeaves += await calculateShortLeave(pendingShortLeaves);
//     const totalShortLeaves =
//       (approvedShortLeaves ? approvedShortLeaves.length : 0) +
//       (pendingShortLeaves ? pendingShortLeaves.length : 0);
//     let leftLeave = 0;
//     const totalLeave = 12;
//     let paidLeave;
//     if (allLeaves <= 12) {
//       paidLeave = allLeaves;
//       leftLeave = totalLeave - allLeaves;
//     } else {
//       paidLeave = 12;
//       allUnpaidLeaves += allLeaves - 12;
//       leftLeave = 0;
//     }

//     const unPaidLeave = allUnpaidLeaves;
//     const remainingLeave = leftLeave;
//     const shortLeave = totalShortLeaves;

//     const leaveBalances = {
//       totalLeave,
//       paidLeave,
//       unPaidLeave,
//       shortLeave,
//       remainingLeave,
//     };

//     res.status(200).json(leaveBalances);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/balance/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const leaveData = await Leaves.find({ employee: userId });

    let accumulatedPaidLeave = 0;
    let totalPaidLeave = 0;
    let totalUnpaidLeave = 0;
    let remainingPaidLeave = 0;

    let monthlyLeaveTaken = Array(12).fill(0);
    let usedShortLeave = Array(12).fill(0);

    for (const leave of leaveData) {
      const leaveDate = new Date(leave.startDate);
      const month = leaveDate.getMonth();
      const leaveStatus = leave.status;
      const leaveType = leave.leaveType;
      let leaveDays = leave.noOfDays;

      if (leaveStatus === "Approved") {
        if (leaveType === "FULL_DAY_LEAVE") {
          monthlyLeaveTaken[month] += leaveDays;
        }
        if (leaveType === "HALF_DAY_LEAVE") {
          monthlyLeaveTaken[month] += 0.5;
        }
        if (leaveType === "SHORT_LEAVE") {
          usedShortLeave[month]++; // Count how many short leaves were taken
          if (usedShortLeave[month] > 2) {
            monthlyLeaveTaken[month] += 0.5; // Convert extra short leaves to half-day leave
          }
        }
      }
    }

    for (let month = 0; month <= currentMonth; month++) {
      accumulatedPaidLeave += 1;

      let totalLeavesThisMonth = monthlyLeaveTaken[month];

      if (totalLeavesThisMonth > 0) {
        if (totalLeavesThisMonth <= accumulatedPaidLeave) {
          totalPaidLeave += totalLeavesThisMonth;
          accumulatedPaidLeave -= totalLeavesThisMonth;
        } else {
          totalPaidLeave += accumulatedPaidLeave;
          totalUnpaidLeave += totalLeavesThisMonth - accumulatedPaidLeave;
          accumulatedPaidLeave = 0;
        }
      }
    }

    remainingPaidLeave = accumulatedPaidLeave;
    let remainingLeave = 12 - totalPaidLeave;

    const shortLeaveRemaining = Math.max(2 - usedShortLeave[currentMonth], 0); // Max ensures it doesn't go negative

    const leaveBalances = {
      totalLeave: 12,
      remainingLeave: remainingLeave,
      paidLeave: totalPaidLeave,
      unPaidLeave: totalUnpaidLeave,
      shortLeave: shortLeaveRemaining, // ✅ Starts at 2 and decreases as leaves are taken
      remainingPaidLeaveInCurrentMonth: remainingPaidLeave,
    };

    res.status(200).json(leaveBalances);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.get("/all-leaves/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();
    const leaveData = await Leaves.find({
      employee: userId,
    })
      .populate("employee")
      .populate("approvedBy");



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

router.get("/stats/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();
    const leaveData = await Leaves.find({
      employee: userId,
      status: { $ne: "Declined" },
    });
    const leaveStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthName = new Date(currentYear, month - 1, 1).toLocaleString(
        "default",
        { month: "long" }
      );
      const leaveDataForMonth = leaveData.filter((leave) => {
        const leaveYear = new Date(leave.startDate).getFullYear();
        const leaveMonth = new Date(leave.startDate).getMonth() + 1;
        return leaveYear === currentYear && leaveMonth === month;
      });
      // .reduce((totalDays, leave) => totalDays + leave.noOfDays, 0);
      let leaveDaysInMonth = 0;
      let approvedFullDayLeave = 0;
      let pendingFullDayLeave = 0;
      let approvedHalfDayLeave = 0;
      let pendingHalfDayLeave = 0;
      let approvedShortLeave = 0;
      let pendingShortLeave = 0;
      let shortLeaves = 0;

      leaveDataForMonth.forEach((leave) => {
        if (
          leave.status === "Approved" &&
          leave.leaveType === "FULL_DAY_LEAVE"
        ) {
          leaveDaysInMonth += leave.noOfDays;
          approvedFullDayLeave += leave.noOfDays;
        } else if (
          leave.status === "Approved" &&
          leave.leaveType === "HALF_DAY_LEAVE"
        ) {
          leaveDaysInMonth += 0.5;
          approvedHalfDayLeave += 0.5;
        } else if (
          leave.status === "Approved" &&
          leave.leaveType === "SHORT_LEAVE"
        ) {
          approvedShortLeave += 1;
          shortLeaves += 1;
        } else if (
          leave.status === "Pending" &&
          leave.leaveType === "FULL_DAY_LEAVE"
        ) {
          leaveDaysInMonth += leave.noOfDays;
          pendingFullDayLeave += leave.noOfDays;
        } else if (
          leave.status === "Pending" &&
          leave.leaveType === "HALF_DAY_LEAVE"
        ) {
          leaveDaysInMonth += 0.5;
          pendingHalfDayLeave += 0.5;
        } else if (
          leave.status === "Pending" &&
          leave.leaveType === "SHORT_LEAVE"
        ) {
          pendingShortLeave += 1;
          shortLeaves += 1;
        }
      });

      leaveDaysInMonth += Math.floor(shortLeaves / 3) * 0.5;
      return {
        month: monthName,
        approvedFullDayLeave,
        pendingFullDayLeave,
        approvedHalfDayLeave,
        pendingHalfDayLeave,
        approvedShortLeave,
        pendingShortLeave,
        leaveDays: leaveDaysInMonth,
        monthNo: month,
        shortLeaves,
      };
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

router.get("/history/:id", auth, async (req, res) => {
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

router.get("/requested/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const leaveData = await Leaves.find({
      notify: userId,
    })
      .populate({
        path: "employee",
        select: "userName designation employeeId firstName lastName profileImage",
      })
      .populate({
        path: "approvedBy.employer",
        select: "userName designation employeeId firstName lastName profileImage",
      })
    res.status(200).json(leaveData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/all-requested-leaves", auth, async (req, res) => {
  try {

    // Fetch leave data with the necessary population
    const leaveData = await Leaves.find({})
      .populate("employee")
      .populate("approvedBy");
    res.status(200).json(leaveData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }


});

router.put("/status-update", auth, async (req, res) => {
  try {
    const { id: userId, employerId, status } = req.body;

    if (!userId || !employerId || !status) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const updatedFields = {
      status,
      approvedBy: employerId,
    };

    const updatedLeave = await Leaves.findOneAndUpdate(
      { _id: userId },
      { $set: updatedFields },
      { new: true, upsert: false } // Upsert set to false for safety
    );

    if (!updatedLeave) {
      return res.status(404).json({ message: "Leave record not found." });
    }

    res.status(200).json({ message: "Leave updated successfully!", leave: updatedLeave });
  } catch (error) {
    console.error("Error updating leave:", error);

    // Specific error handling for validation errors, database issues, etc.
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Leave ID format." });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }

});
router.delete("/delete-leave/:id", auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Image.deleteOne({ _id: id });
    res.status(200).send({ message: "Leave deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/update-leave", auth, async (req, res) => {
  try {
    const updatedFields = { ...req.body, status: "Pending", approvedBy: null };

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
      req.body.id, // Pass the ID directly here
      { $set: updatedFields },
      { new: true, upsert: true }
    );

    res.status(200).send({ message: "Leave detail updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


router.get("/today-stats", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const employee = await Employee.find(
      {
        status: "Active",
        superAdmin: { $ne: true }
      },
      { password: 0 }
    );
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
