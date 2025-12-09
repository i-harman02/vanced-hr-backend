const express = require("express");
const router = express.Router();
const Leaves = require("../../../models/onLeaveToday");
const LeaveBalance = require("../../../models/leaveBalances");
const Image = require("../../../models/image");
const Employee = require("../../../models/employee");
const auth = require("../../helpers/auth");
const calculateShortLeave = require("../../helpers/calculateShortLeaves");
const sendMail = require("../../../helpers/nodemailer");
const path = require("path");
const dayjs = require('dayjs');
//const nodemailer = require("nodemailer");

// router.post("/apply-leave", auth, async (req, res) => {
//   try {
//     const {
//       employee,
//       startDate,
//       endDate,
//       leaveType,
//       noOfDays,
//       reason,
//       notify,
//       approvedBy,
//       status,
//       startTime,
//       endTime,
//       durations,
//     } = req.body;
//     const startDateObj = new Date(startDate);
//     const endDateObj = new Date(endDate);
//     const overlappingLeaveRequest = await Leaves.findOne({
//       employee,
//       startDate: { $lte: endDate },
//       endDate: { $gte: startDate },
//     }).sort({ createdAt: -1 });
//     if (overlappingLeaveRequest) {
//       return res
//         .status(400)
//         .json({ message: "Leave request overlaps with existing leave" });
//     }
//     const employeeDetails = await Employee.findById(employee);

//     if (!employeeDetails) {
//       return res.status(400).json({ message: "Employee not found" });
//     }
//     const replacements = {
//       EmployeeName: `${employeeDetails.firstName} ${employeeDetails.lastName}`,
//       Designation: employeeDetails.role,
//       LeaveType: leaveType,
//       StartDate: startDateObj.toLocaleDateString(),
//       EndDate: endDateObj.toLocaleDateString(),
//       NumberOfDays: noOfDays,
//       Reason: reason,
//     };

//     let findManager = await Employee.findOne({ role: "manager" });

//     const newLeave = new Leaves({
//       employee,
//       startDate,
//       endDate,
//       leaveType,
//       noOfDays,
//       reason,
//       notify: findManager ? [...notify, findManager._id] : notify,
//       approvedBy,
//       status,
//       startTime,
//       endTime,
//       durations,
//     });

//     await newLeave.save();

//     const templateName = "leaveTemplate.html";

//     const notifyList = Array.isArray(notify) ? notify : [notify];
//     const toEmails = [process.env.HR_MAIL];
//     // const toEmails = notifyList[0] ? [notifyList[0]] : [];

//     // const ccList = [
//     //   ...(notifyList[1] ? [notifyList[1]] : []),
//     //   process.env.CC_MAIL1,
//     //   process.env.CC_MAIL2,
//     // ];
//     const ccList = [
//       ...notifyList.filter((email) => email && email !== process.env.HR_MAIL),
//       process.env.CC_MAIL1,
//       process.env.CC_MAIL2,
//     ];

//     await sendMail({
//       to: toEmails,
//       cc: ccList,
//       subject: "Leave Information",
//       templateName,
//       replacements,
//     });

//     res.status(201).json({ message: "Leave applied successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// });

router.post("/apply-leave", auth, async (req, res) => {
  try {
    const {
      employee,
      startDate,
      endDate,
      leaveType,
      noOfDays,
      reason,
      notify=[],
      approvedBy,
      status,
      startTime,
      endTime,
      durations,
    } = req.body;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
     
    const overlappingLeaveRequest = await Leaves.findOne({
      employee,
       status: { $in: ["Approved", "Pending"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).sort({ createdAt: -1 });
   
    if (overlappingLeaveRequest) {
      return res
        .status(400)
        .json({ message: "Leave request overlaps with existing leave" });
    }
    const employeeDetails = await Employee.findById(employee);

    if (!employeeDetails) {
      return res.status(400).json({ message: "Employee not found" });
    }
    const readableLeaveType = formatLeaveType(leaveType);
    // const durationText = formatDuration(leaveType, startTime, endTime, noOfDays);
    let durationText = "";
    
    
    if (leaveType === "SHORT_LEAVE") {
      
      const formattedStartTime = dayjs(startTime).format("HH:mm");
      const formattedEndTime = dayjs(endTime).format("HH:mm");
      durationText = `${formattedStartTime} - ${formattedEndTime}`;
    } else if (leaveType === "FULL_DAY_LEAVE" || leaveType === "HALF_DAY_LEAVE") {
     
      durationText = `${noOfDays} day${noOfDays > 1 ? "s" : ""}`;
    }
    const replacements = {
      EmployeeName: `${employeeDetails.firstName} ${employeeDetails.lastName??" "}`,
      Designation: employeeDetails.role,
      LeaveType: readableLeaveType,
      Duration:durationText,
      StartDate: startDateObj.toLocaleDateString(),
      EndDate: endDateObj.toLocaleDateString(),
      NumberOfDays: noOfDays,
      Reason: reason,
      StartTime:startTime,
      EndTime:endTime
    
    };
    const templateName = "leaveTemplate.html";

    let findManager = await Employee.findOne({ role: "manager" });

    let notifyList = Array.isArray(notify) ? notify : [notify];
    if (findManager) notifyList.push(findManager._id);
    const notifyEmployees = await Employee.find({ _id: { $in: notifyList } });
    const teamLeader= notifyEmployees[0]?.email ? [notifyEmployees[0].email] : [];
    const toEmails =process.env.HR_MAIL
    const ccList = [
      ...notifyEmployees.slice(1).map(e => e.email).filter(Boolean),
      process.env.CC_MAIL1,
      process.env.CC_MAIL2,
      teamLeader
    ].filter(Boolean);

    const newLeave = new Leaves({
      employee,
      startDate,
      endDate,
      leaveType,
      noOfDays,
      reason,
      notify: notifyList,
      approvedBy,
      status,
      startTime,
      endTime,
      durations:durationText,
    });

    await newLeave.save();

    // const templateName = "leaveTemplate.html";

    // const notifyList = Array.isArray(notify) ? notify : [notify];
    // const toEmails = notifyList[0] ? [notifyList[0]] : [];

    // const ccList = [
    //   ...(notifyList[1] ? [notifyList[1]] : []),
    //   process.env.CC_MAIL1,
    //   process.env.CC_MAIL2,
    // ];

    await sendMail({
      to: toEmails,
      cc: ccList,
      subject: "Leave Information",
      templateName,
      replacements,
    });

    res.status(201).json({ message: "Leave applied successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/on-leave", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const employeesOnLeaveToday = await Leaves.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    })
      .populate({
        path: "employee",
        select:
          "userName designation employeeId firstName lastName email personalInformation.telephones address profileImage",
      })
      .sort({ createdAt: -1 });

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
          usedShortLeave[month]++;
        }
      }
    }

    for (let month = 0; month <= currentMonth; month++) {
      accumulatedPaidLeave += 1; // Earn 1 paid leave per month

      let totalLeavesThisMonth = monthlyLeaveTaken[month];
      let extraShortLeaves = Math.max(usedShortLeave[month] - 2, 0); // Short leaves after 2

      let convertedShortLeaves = extraShortLeaves * 0.5; // Each extra short leave counts as 0.5 leave

      totalLeavesThisMonth += convertedShortLeaves;

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

    // const shortLeaveDisplay = usedShortLeave[currentMonth]; // Show exact number of short leaves
    const absentLeave = await Leaves.find({
      employee: userId,
      status: "Absent",
    });
    const floaterLeave = await Leaves.find({
      employee: userId,
      leaveType: "FLOATER_LEAVE",
      status: "Approved",
    });
    const absentDays = absentLeave.reduce((total, leave) => {
      return total + (leave.noOfDays || 0);
    }, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const shortLeaveDisplay = await Leaves.find({
      employee: userId,
      leaveType: "SHORT_LEAVE",
      status: "Approved",
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const leaveBalances = {
      totalLeave: 12,
      remainingLeave: remainingLeave,
      paidLeave: totalPaidLeave,
      unPaidLeave: totalUnpaidLeave + absentDays,
      shortLeave: 2 - shortLeaveDisplay.length, // Shows the exact number of short leaves
      remainingPaidLeaveInCurrentMonth: remainingPaidLeave,
      floaterLeave: floaterLeave.length,
    };

    res.status(200).json(leaveBalances);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// router.get("/all-leaves/:id", auth, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const currentYear = new Date().getFullYear();
//     const leaveData = await Leaves.find({
//       employee: userId, //Important
//     })
//       .populate("employee")
//       .populate("approvedBy")
//       .sort({ createdAt: -1 });

//     const leavesByYear = leaveData.filter((leave) => {
//       const leaveYear = new Date(leave.startDate).getFullYear();
//       return leaveYear;
//       //=== currentYear;
//     });
//     const totalItems = leavesByYear.length;
//     const totalPages = Math.ceil(totalItems / limit);

//     const paginatedLeaves = leavesByYear.slice(skip, skip + limit);

//     // res.status(200).json(leavesByYear);
//     res.status(200).json({
//       leaveData: paginatedLeaves,
//       pagination: {
//         totalItems,
//         totalPages,
//         currentPage: page,
//         itemsPerPage: limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/all-leaves/:id", auth, async (req, res) => {
  try {
    const decoded = res.locals.decode;
    const loggedInUser = await Employee.findById(decoded.id).lean();
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let projection = { password: 0 };

    if (loggedInUser.role !== "admin") {
      projection.bankInformation = 0;
      projection.address = 0;
    }
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const daysFilter = parseInt(req.query.days);
    const searchQuery = req.query.search;
    const statusFilter = req.query.status;
    let query = { employee: userId };
    if (statusFilter && statusFilter.toLowerCase() !== "all") {
      query.status = new RegExp(`^${statusFilter.trim()}$`, "i");
    }

    if (!isNaN(daysFilter) && daysFilter > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
      query.createdAt = { $gte: cutoffDate };
    }
    let leaveData = await Leaves.find(query)
      .populate({ path: "employee", select: projection })
      .populate({ path: "approvedBy", select: projection })
      .sort({ createdAt: -1 });

    //   if (searchQuery) {
    //   const regex = new RegExp(searchQuery, "i");
    //   leaveData = leaveData.filter(
    //     (leave) =>
    //       (leave.leaveType && regex.test(leave.leaveType)) ||
    //       (leave.reason && regex.test(leave.reason))
    //   );
    // }

    if (searchQuery) {
      const search = searchQuery.toLowerCase().trim();
      const regex = new RegExp(searchQuery, "i");

      leaveData = leaveData.filter((leave) => {
        const normalizedLeaveType = leave.leaveType
          ?.replace(/_/g, " ")
          .toLowerCase();

        return (
          (normalizedLeaveType && normalizedLeaveType.includes(search)) ||
          (leave.reason && regex.test(leave.reason))
        );
      });
    }

    const totalItems = leaveData.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedLeaves = leaveData.slice(skip, skip + limit);
    res.status(200).json({
      leaveData: paginatedLeaves,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
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
    }).sort({ createdAt: -1 });
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
    }).sort({ createdAt: -1 });
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
    const decoded = res.locals.decode;
    const loggedInUser = await Employee.findById(decoded.id).lean();
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const daysFilter = parseInt(req.query.days);
    const searchQuery = req.query.search;
    const leaveTypeFilter = req.query.leaveType;
    const statusFilter = req.query.status;


    let baseQuery = {};
    if (loggedInUser.role !== "admin") {
      baseQuery.notify = userId;
    }
    if (leaveTypeFilter && leaveTypeFilter.toUpperCase() !== "ALL") {
      baseQuery.leaveType = leaveTypeFilter;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (daysFilter && !isNaN(daysFilter)) {

      const end = new Date(today);
      end.setHours(23, 59, 59, 999);

      const start = new Date(today);
      start.setDate(start.getDate() - (daysFilter - 1));
      start.setHours(0, 0, 0, 0);

      baseQuery.$and = [
        { startDate: { $lte: end } },
        { endDate: { $gte: start } }
      ];
    }



    if (statusFilter && statusFilter.toLowerCase() !== "all") {
      baseQuery.status = new RegExp(`^${statusFilter.trim()}$`, "i");
    }

    if (searchQuery) {
      const word = searchQuery.trim();

      let matchingEmployees = await Employee.find({
        firstName: { $regex: word, $options: "i" },
      }).select("_id");

      if (matchingEmployees.length === 0) {
        matchingEmployees = await Employee.find({
          lastName: { $regex: word, $options: "i" },
        }).select("_id");
      }

      if (matchingEmployees.length === 0) {
        const nameParts = word.split(/\s+/);  
        if (nameParts.length > 1) {
          const firstPart = nameParts[0];
          const lastPart = nameParts[nameParts.length - 1];
          matchingEmployees = await Employee.find({
            firstName: { $regex: firstPart, $options: "i" },
            lastName: { $regex: lastPart, $options: "i" },
          }).select("_id");
        }
      }

      const employeeIds = matchingEmployees.map((emp) => emp._id);

      if (employeeIds.length === 0) {
        return res.status(200).json({
          leaveData: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      }

      baseQuery.employee = { $in: employeeIds };
    }

    const totalCount = await Leaves.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalCount / limit);

    const leaveData = await Leaves.find(baseQuery)
      .sort({ createdAt:-1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "employee",
        select:
          "userName designation employeeId firstName lastName profileImage",
      })
      .populate({
        path: "approvedBy",
        select:
          "userName designation employeeId firstName lastName profileImage",
      });
// const pipeline = [
//   { $match: baseQuery },

    //   {
    //     $addFields: {
    //       isOnLeaveToday: {
    //         $cond: [
    //           {
    //             $and: [
    //               { $lte: ["$startDate", today] },
    //               { $gte: ["$endDate", today] }
    //             ]
    //           },
    //           1,
    //           0
    //         ]
    //       }
    //     }
    //   },
    //   { $sort: { isOnLeaveToday: -1, createdAt: -1 } },

    //   { $skip: skip },
    //   { $limit: limit },

    //   {
    //     $lookup: {
    //       from: "employees",
    //       localField: "employee",
    //       foreignField: "_id",
    //       as: "employee"
    //     }
    //   },
    //   { $unwind: "$employee" },

//   {
//     $lookup: {
//       from: "employees",
//       localField: "approvedBy",
      
//       foreignField: "_id",
//       as: "approvedBy"
//     }
//   },
//   { $unwind: { path: "$approvedBy", preserveNullAndEmptyArrays: true } },
//   {
//     $project: {
//       isOnLeaveToday: 0
//     }
//   }
// ];

    // const leaveData = await Leaves.aggregate(pipeline);

    res.status(200).json({
      leaveData,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});



// router.get("/requested/:id", auth, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const daysFilter = parseInt(req.query.days);
//     const searchQuery = req.query.search;

//     const baseQuery = { notify: userId };

//     const leaveTypeFilter = req.query.leaveType;
//     if (leaveTypeFilter && leaveTypeFilter.toUpperCase() !== "ALL") {
//       baseQuery.leaveType = leaveTypeFilter;
//     }

//     if (daysFilter && !isNaN(daysFilter) && daysFilter > 0) {
//       const cutoffDate = new Date();
//       cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
//       baseQuery.createdAt = { $gte: cutoffDate };
//     }
//     if (searchQuery) {
//       const word = searchQuery.trim();

//       let matchingEmployees = await Employee.find({
//         firstName: { $regex: word, $options: "i" },
//       }).select("_id");

//       if (matchingEmployees.length === 0) {
//         matchingEmployees = await Employee.find({
//           lastName: { $regex: word, $options: "i" },
//         }).select("_id");
//       }

//       if (matchingEmployees.length === 0) {
//         const nameParts = word.split(/\s+/);
//         if (nameParts.length > 1) {
//           const firstPart = nameParts[0];
//           const lastPart = nameParts[nameParts.length - 1];
//           matchingEmployees = await Employee.find({
//             firstName: { $regex: firstPart, $options: "i" },
//             lastName: { $regex: lastPart, $options: "i" },
//           }).select("_id");
//         }
//       }

//       const employeeIds = matchingEmployees.map((emp) => emp._id);

//       if (employeeIds.length === 0) {
//         return res.status(200).json({
//           leaveData: [],
//           pagination: {
//             totalItems: 0,
//             totalPages: 0,
//             currentPage: page,
//             itemsPerPage: limit,
//             hasNextPage: false,
//             hasPrevPage: false,
//           },
//         });
//       }

//       baseQuery.employee = { $in: employeeIds };
//     }

//     const totalCount = await Leaves.countDocuments(baseQuery);
//     const totalPages = Math.ceil(totalCount / limit);

//     const leaveData = await Leaves.find(baseQuery)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate({
//         path: "employee",
//         select:
//           "userName designation employeeId firstName lastName profileImage",
//       })
//       .populate({
//         path: "approvedBy",
//         select:
//           "userName designation employeeId firstName lastName profileImage",
//       });

//     res.status(200).json({
//       leaveData,
//       pagination: {
//         totalItems: totalCount,
//         totalPages: totalPages,
//         currentPage: page,
//         itemsPerPage: limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/all-requested-leaves", auth, async (req, res) => {
  try {
    const decoded = res.locals.decode;
    const loggedInUser = await Employee.findById(decoded.id).lean();
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }


    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    const daysFilter = parseInt(req.query.days);
    const searchQuery = req.query.search;
    const leaveTypeFilter = req.query.leaveType;
    const statusFilter = req.query.status;

    let baseQuery = {};

    if (leaveTypeFilter && leaveTypeFilter.toUpperCase() !== "ALL") {
      baseQuery.leaveType = leaveTypeFilter;
    }


    // const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (daysFilter && !isNaN(daysFilter)) {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);

      const start = new Date(today);
      start.setDate(start.getDate() - (daysFilter - 1));
      start.setHours(0, 0, 0, 0);

      baseQuery.$and = [
        { startDate: { $lte: end } },
        { endDate: { $gte: start } }
      ];
    }


    if (statusFilter && statusFilter.toLowerCase() !== "all") {
      baseQuery.status = new RegExp(`^${statusFilter.trim()}$`, "i");
    }

    if (searchQuery) {
      const word = searchQuery.trim();

      let matchingEmployees = await Employee.find({
        firstName: { $regex: word, $options: "i" },
      }).select("_id");

      if (matchingEmployees.length === 0) {
        matchingEmployees = await Employee.find({
          lastName: { $regex: word, $options: "i" },
        }).select("_id");
      }

      if (matchingEmployees.length === 0) {
        const nameParts = word.split(/\s+/);
        if (nameParts.length > 1) {
          const firstPart = nameParts[0];
          const lastPart = nameParts[nameParts.length - 1];
          matchingEmployees = await Employee.find({
            firstName: { $regex: firstPart, $options: "i" },
            lastName: { $regex: lastPart, $options: "i" },
          }).select("_id");
        }
      }

      const employeeIds = matchingEmployees.map((emp) => emp._id);

      if (employeeIds.length === 0) {
        return res.status(200).json({
          leaveData: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      }

      baseQuery.employee = { $in: employeeIds };
    }

    const totalCount = await Leaves.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalCount / limit);

    const today = new Date();
    today.setHours(0,0,0,0); 
    const pipeline = [
  { $match: baseQuery },
  {
    $addFields: {
      isOnLeaveToday: {
        $cond: [
          {
            $and: [
              { $lte: ["$startDate", today] },
              { $gte: ["$endDate", today] }
            ]
          },
          1,
          0
        ]
      }
    }
  },
  { $sort: { isOnLeaveToday: -1, createdAt: -1 } },

    //   { $skip: skip },
    //   { $limit: limit },

    //   {
    //     $lookup: {
    //       from: "employees",
    //       localField: "employee",
    //       foreignField: "_id",
    //       as: "employee"
    //     }
    //   },
    //   { $unwind: "$employee" },

  {
    $lookup: {
      from: "employees",
      localField: "approvedBy",
      foreignField: "_id",
      as: "approvedBy"
    }
  },
  { $unwind: { path: "$approvedBy", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      isOnLeaveToday: 0
    }
  }
];

    // const leaveData = await Leaves.aggregate(pipeline);

    res.status(200).json({
      leaveData,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});



router.put("/status-update", auth, async (req, res) => {
  try {
    const { id: userId, employerId, status, reason } = req.body;

    if (!userId || !employerId || !status) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const updatedFields = {
      status,
      reason,
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

    res
      .status(200)
      .json({ message: "Leave updated successfully!", leave: updatedLeave });
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
    let deleted = await Leaves.deleteOne({ _id: id });
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
        superAdmin: { $ne: true },
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
    }).sort({ createdAt: -1 });
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
