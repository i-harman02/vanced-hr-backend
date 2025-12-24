const express = require("express");
const nodemailer = require("nodemailer");
const { promisify } = require("util");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const config = require("../../../config");
const { JWT_SECRET } = config;
const removeImage = require("../../helpers/deleteImage/deleteImage");
const auth = require('../../helpers/auth');
const Leaves = require("../../../models/onLeaveToday");
const Performances = require("../../../models/performance");
const Promotion = require("../../../models/promotion");
const Resignation = require("../../../models/resignation");
const Termination = require("../../../models/termination");
const Teams = require("../../../models/team");
const Announcement = require("../../../models/announcement");
const Comments = require("../../../models/comment");
const DeleteUploadedImage = require("../../helpers/deleteImage/deleteUploadedImage");

const router = express.Router();
const saltRounds = 10;

router.post("/add-employee",auth, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password || !firstName ) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      const existingEmail = await Employee.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const empId = `${email.split("@")[0]}@vanced`;
      const newUser = await Employee.create({
        ...req.body, 
        password: hashedPassword, 
        role: role || "employee", 
        employeeId: empId, 
      });

      res.status(201).json({
        message: "Employee registered successfully",
        userId: newUser._id,
      });
    } catch (error) {
      console.error("Error during employee registration:", error);
      res.status(500).json({ message: "Internal server error" });
    }

});

router.put("/update-employee", auth, async (req, res) => {
  try {
    const { id, password, profileImage, ...rest } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const updatedFields = { ...rest };

    if (password) {
      updatedFields.password = await bcrypt.hash(password, saltRounds);
    }

   
    if (profileImage) {
      const user = await Employee.findById(id).select("profileImage");
      if (user?.profileImage) {
        const deleted = await DeleteUploadedImage(user.profileImage);
        if (!deleted) console.error("Failed to delete previous profile image");
      }
      updatedFields.profileImage = profileImage;
    }

    
    const updatedUser = await Employee.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee details updated successfully", updatedUser });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});


  router.put("/employee-status/:id", auth, async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedFields = { status: "Inactive" };
      await Employee.findByIdAndUpdate(
        { _id: userId },
        { $set: updatedFields },
        { new: true }
      );
      res.status(200).json({ message: "Employee detail updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  router.get("/list", auth, async (req, res) => {
    try {
      const usersImg = await Image.find({});
    const loggedInUser= await Employee.findById(userId).lean();
      if (loggedInUser.role !== "admin"){
      let projection={password:0};
      projection.bankInformation=0;
      projection.identityInformation=0;
      projection.personalInformation=0;
      projection.birthday=0;
      projection.education=0;
      projection.experience=0;
      projection.appraisalDate=0;
      projection.emergencyContact=0;
      projection.acceptPolicies=0;
      projection.dateOfJoining=0;
      projection.image=0;
      }
    
      const users = await Employee.find({},projection);
        const employee = users.map(async (val, idx) => {
        const user_Id = val._id;
        const employeeImg = usersImg.find((elm) => elm.user_Id.equals(user_Id));
        const image = employeeImg
          ? { path: employeeImg.path, id: employeeImg.id }
          : "";
        return { ...val._doc, image };
      });

      const employees = await Promise.all(employee);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  router.get("/active-user", auth, async (req, res) => {
    try {
     const decoded = res.locals.decode;
    const userId = decoded.id;

    const loggedInUser = await Employee.findById(userId).lean();

    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let projection = { password: 0 };


    if (loggedInUser.role !== "admin") {
      projection.bankInformation = 0;
      projection.address = 0;
      projection.personalInformation=0;
      projection.emergencyContact=0;
      projection.identityInformation=0;
      projection.acceptPolicies=0;
      projection.education=0;
      projection.appraisalDate=0;
      projection.birthday=0;
      projection.employeeSalary=0;
      projection.gender=0;
    }

      const users = await Employee.find(
        { 
          status: "Active", 
          superAdmin: { $ne: true }
        },
        projection ,
      );
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  router.delete("/delete/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).send({ message: "Employee ID is required!" });
      }
        await Promise.all([
           Leaves.deleteMany({ employee: id }),
          Performances.deleteMany({ employee: id }),
          Promotion.deleteMany({ promotedEmployee: id }),
          Resignation.deleteMany({ resignationEmployee: id }),
          Termination.deleteMany({ terminatedEmployee: id }),

Teams.updateMany(
    {
      $or: [
        { "teamLeader.id": id },
        { "teamMember.id": id },
      ],
    },
    {
      $pull: {
        teamLeader: { id },          
        teamMember: { id }        
      },
    }
  ),

  Announcement.deleteMany({ employee: id }),
  Comments.deleteMany({ employee: id }),
]);

await Teams.deleteMany({
  $or: [
    { teamLeader: { $size: 0 } },      
    { teamMember: { $size: 0 } },
  ],
});

await Employee.deleteOne({ _id: id });

      // await removeImage(id);
      // const updatedFields = { status: "Inactive" };
      // await Employee.findByIdAndUpdate(
      //   { _id: id },
      //   { $set: updatedFields },
      //   { new: true, upsert: true }
      // );

      res
        .status(200)
        .send({ message: "Employee deleted successfully!", });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  module.exports = router;
