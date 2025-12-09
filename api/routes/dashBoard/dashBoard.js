const express = require("express");
const router = express.Router();
const Projects = require("../../../models/projects");
const Client = require("../../../models/client");
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.get("/all-count",auth, async (req, res) => {
  try {
    const employee = await Employee.find({superAdmin: { $ne: true },});
    const client = await Client.find({});
    const project = await Projects.find({});
    const totalProjects = project.length;
    const totalClients = client.length;
    const activeEmployees=employee.filter(e=>e.status==="Active")
    const totalEmployees =activeEmployees.length;
    const activeTask = 54;
    const data = { totalEmployees, activeTask, totalClients, totalProjects };
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
