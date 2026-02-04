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
const dayjs = require("dayjs");
const multer = require("multer");
const fs = require("fs");
function formatLeaveType(type) {
  const map = {
    SHORT_LEAVE: "SHORT LEAVE",
    FULL_DAY_LEAVE: "FULL DAY LEAVE",
    HALF_DAY_LEAVE: "HALF DAY LEAVE",
  };
  return map[type] || type;
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });



router.post(
  "/apply-leave",
  auth,
  upload.single("attachment"),
  async (req, res) => {
    try {
      const employeeId = req.user.id; // ✅ FROM TOKEN

      const {
        startDate,
        endDate,
        leaveType,
        noOfDays,
        reason,
        notify = [],
      } = req.body;

      const overlappingLeaveRequest = await Leaves.findOne({
        employee: employeeId,
        status: { $in: ["Approved", "Pending"] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      });

      if (overlappingLeaveRequest) {
        return res
          .status(400)
          .json({ message: "Leave request overlaps with existing leave" });
      }

      const newLeave = await Leaves.create({
        employee: employeeId, // ✅ AUTO MAP
        startDate,
        endDate,
        leaveType,
        noOfDays,
        reason,
        notify,
        status: "Pending",
      });

      res.status(201).json({
        message: "Leave applied successfully",
        leave: newLeave,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);



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
      accumulatedPaidLeave += 1;

      let totalLeavesThisMonth = monthlyLeaveTaken[month];
      let extraShortLeaves = Math.max(usedShortLeave[month] - 2, 0);

      let convertedShortLeaves = extraShortLeaves * 0.5;

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
      shortLeave: 2 - shortLeaveDisplay.length,
      remainingPaidLeaveInCurrentMonth: remainingPaidLeave,
      floaterLeave: floaterLeave.length,
    };

    res.status(200).json(leaveBalances);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

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
      projection.personalInformation = 0;
      projection.emergencyContact = 0;
      projection.identityInformation = 0;
      projection.acceptPolicies = 0;
      projection.education = 0;
      projection.appraisalDate = 0;
      projection.employeeSalary = 0;
      projection.birthday = 0;
      projection.dateOfJoining = 0;
      projection.experience = 0;
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
        { endDate: { $gte: start } },
      ];
    }
    if (statusFilter && statusFilter.toLowerCase() !== "all") {
      baseQuery.status = new RegExp(`^${statusFilter.trim()}$`, "i");
    }
    if (searchQuery) {
      const word = searchQuery.trim();
      const isDateSearch = !isNaN(Date.parse(word));
      if (isDateSearch) {
        const start = new Date(word);
        start.setHours(0, 0, 0, 0);

        const end = new Date(word);
        end.setHours(23, 59, 59, 999);

        baseQuery.startDate = {
          $gte: start,
          $lte: end,
        };
      } else {
        const matchingEmployees = await Employee.find({
          $or: [
            { firstName: { $regex: word, $options: "i" } },
            { lastName: { $regex: word, $options: "i" } },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$firstName", " ", "$lastName"] },
                  regex: word,
                  options: "i",
                },
              },
            },
          ],
        }).select("_id");

        if (matchingEmployees.length === 0) {
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

        baseQuery.employee = {
          $in: matchingEmployees.map((emp) => emp._id),
        };
      }
    }

    const totalCount = await Leaves.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalCount / limit);

    const leaveData = await Leaves.find(baseQuery)
      .sort({ createdAt: -1 })
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
        { endDate: { $gte: start } },
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
      .sort({ createdAt: -1 })
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
      { new: true, upsert: false }
    );

    if (!updatedLeave) {
      return res.status(404).json({ message: "Leave record not found." });
    }

    res
      .status(200)
      .json({ message: "Leave updated successfully!", leave: updatedLeave });
  } catch (error) {
    console.error("Error updating leave:", error);

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
      req.body.id,
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
