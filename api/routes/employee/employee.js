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

router.post("/add-employee", auth, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validate required fields
      if (!email || !password || !firstName ) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      // Check if email already exists
      const existingEmail = await Employee.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate unique employee ID
      const empId = `${email.split("@")[0]}@vanced`;

      // Create and save the new user
      const newUser = await Employee.create({
        ...req.body, // Spread all properties from req.body
        password: hashedPassword, // Override with hashed password
        role: role || "employee", // Ensure default role if blank or undefined
        employeeId: empId, // Add computed employee ID
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
      const password = req?.body?.password;
      const hashedPassword = password
        ? await bcrypt.hash(password, saltRounds)
        : "";

      const updatedFields = password
        ? { ...req.body, password: hashedPassword }
        : req.body;

      if (req.body.profileImage) {
        const user = await Employee.findOne({ _id: req.body.id });
        if (user?.profileImage) {
          const deletionResult = await DeleteUploadedImage(user.profileImage);
          if (!deletionResult) {
            console.error('Failed to delete previous profile image');
          }
        }
      }

      try {
        const updatedUser = await Employee.findByIdAndUpdate(
          { _id: req.body.id },
          { $set: updatedFields },
          { new: true, upsert: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({ message: "Employee detail updated successfully" });
      } catch (dbError) {
        console.error('Error updating employee:', dbError);
        res.status(500).json({ message: "Error updating employee details" });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });


  router.put("/employee-status/:id", auth, async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedFields = { status: "Inactive" };
      await Employee.findByIdAndUpdate(
        { _id: userId },
        { $set: updatedFields },
        { new: true, upsert: true }
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
      const users = await Employee.find({}, { password: 0 });
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
      // await Promise.all([
      //   Leaves.deleteMany({ employee: id }), 
      //   Performances.deleteMany({ employee: id }), 
      //   Promotion.deleteMany({ promotedEmployee: id }), 
      //   Resignation.deleteMany({ resignationEmployee: id }), 
      //   Termination.deleteMany({ terminatedEmployee: id }),
      //   Teams.updateMany(
      //     {
      //       $or: [
      //         { "teamLeader.id": id }, 
      //         { "teamMember.id": id }, 
      //       ],
      //     },
      //     {
      //       $pull: { 
      //         "teamLeader.id": id, 
      //         "teamMember.id": { $in: [id] }, 
      //       },
      //     }
      //   ),
      //   Announcement.deleteMany({employee : id}),
      //   Comments.deleteMany({employee : id }),

      // ]);
      // await Teams.deleteMany({
      //   $or: [
      //     { "teamLeader.id": { $exists: false } },  
      //     // { "teamMember.id": { $size: 0 } },  // No members
      //   ],
      // });
      // const deleted = await Employee.deleteOne({ _id: id });
      // await removeImage(id);

      const updatedFields = { status: "Inactive" };
      await Employee.findByIdAndUpdate(
        { _id: id },
        { $set: updatedFields },
        { new: true, upsert: true }
      );

      res
        .status(200)
        .send({ message: "Employee deleted successfully!", });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  module.exports = router;
