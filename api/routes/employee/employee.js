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

const router = express.Router();
const saltRounds = 10;

router.post("/add-employee", async (req, res) => {
  try {
    const {
      userName,
      status,
      password,
      role,
      email,
      birthday,
      designation,
      address,
      gender,
      dateOfJoining,
      firstName,
      lastName,
      personalInformation,
      emergencyContact,
      bankInformation,
      education,
      experience,
    } = req.body;

    // Check if email already exists
    const existingEmail = await Employee.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = email.substring(0, email.indexOf("@"));
    const empId = `${result}${"@vanced"}`;
    // Create a new user
    const newUser = new Employee({
      userName,
      password: hashedPassword,
      status,
      role,
      email,
      birthday,
      designation,
      address,
      gender,
      employeeId: empId,
      dateOfJoining,
      firstName,
      lastName,
      personalInformation,
      emergencyContact,
      bankInformation,
      education,
      experience,
    });
    await newUser.save();

    // Generate JWT token
    // const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
    //   expiresIn: "1h",
    // });

    res.status(201).json({
      message: "Employee registered successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/update-employee", async (req, res) => {
  try {
    const password = req?.body?.password;
    const hashedPassword = password
      ? await bcrypt.hash(password, saltRounds)
      : "";
    const updatedFields = password
      ? { ...req.body, password: hashedPassword }
      : req.body;

    await Employee.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: "Employee detail updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/employee-status/:id", async (req, res) => {
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

router.get("/list", async (req, res) => {
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

router.delete("/delete/:id", async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Employee.deleteOne({ _id: id });
    await removeImage(id);
    res
      .status(200)
      .send({ message: "Employee deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
