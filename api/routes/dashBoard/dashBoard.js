const express = require("express");
const router = express.Router();
const Projects = require("../../../models/projects");
const Client = require("../../../models/client");
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const Leaves = require("../../../models/onLeaveToday");
const auth = require('../../helpers/auth')

router.get("/all-count",auth, async (req, res) => {
  try {
    if (!req.user && res.locals.decode) req.user = res.locals.decode;
    const loggedInUser = await Employee.findById(req.user.id).lean();
    if (!loggedInUser) return res.status(404).json({ message: "User not found" });

    const isPrivileged = loggedInUser.role === "admin" || 
                         loggedInUser.role === "superadmin" || 
                         loggedInUser.assignRole === "HR" || 
                         loggedInUser.assignRole === "HR Manager" ||
                         loggedInUser.assignRole === "Manager";

    let empQuery = { superAdmin: { $ne: true } };
    let leaveQueryScope = {};

    if (!isPrivileged) {
      // TLs and Managers only see their team
      empQuery.$or = [{ tl: loggedInUser._id }, { manager: loggedInUser._id }];
      
      const teamEmployees = await Employee.find(empQuery).select("_id");
      const teamIds = teamEmployees.map(emp => emp._id);
      leaveQueryScope = { employee: { $in: teamIds } };
    }

    const employee = await Employee.find(empQuery);
    const client = await Client.find({});
    const project = await Projects.find({});
    
    // Calculate on leave today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const leavesToday = await Leaves.find({
      ...leaveQueryScope,
      status: "Approved",
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
    });

    const totalProjects = project.length;
    const totalClients = client.length;
    const activeEmployees = employee.filter(e => e.status === "Active");
    const totalEmployees = activeEmployees.length;
    const totalEmployeesOnLeave = leavesToday.length;
    
    // Add leave counts based on scope
    const totalPending = await Leaves.countDocuments({ ...leaveQueryScope, status: "Pending" });
    const totalApproved = await Leaves.countDocuments({ ...leaveQueryScope, status: "Approved" });
    const totalRejected = await Leaves.countDocuments({ ...leaveQueryScope, status: "Declined" });

    const activeTask = 54;
    
    const data = { 
      totalEmployees, 
      activeTask, 
      totalClients, 
      totalProjects,
      totalEmployeesOnLeave,
      totalPending,
      totalApproved,
      totalRejected
    };
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});


router.get("/new-employee",auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const usersImg = await Image.find({});
    const employee = await Employee.find(
      {
        dateOfJoining: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        superAdmin: { $ne: true },
      },
      { password: 0 }
    );
    const user = employee.map(async (val, idx) => {
      const user_Id = val._id;
      const employeeImg = usersImg.find((elm) => elm.user_Id.equals(user_Id));
      const image = employeeImg
        ? { path: employeeImg.path, id: employeeImg.id }
        : "";
      return { ...val._doc, image };
    });
    const employees = await Promise.all(user);
    res.status(200).json(employees);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
module.exports = router;
