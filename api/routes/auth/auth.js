const express = require("express");
const router = express.Router();
const config = require("../../../config");

const Employee = require("../../../models/employee");
const User = require("../../../models/users"); // ✅ ADD THIS

const { JWT_SECRET } = config;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const BlackList = require("../../../models/blackList");
const auth = require("../../helpers/auth");

/**
 * ======================
 * SIGNUP
 * ======================
 */
router.post("/signup", async (req, res) => {
  try {
    const { 
      name, lastName, email, password, role, superAdmin, assignRole, designation, 
      tl, manager, address, gender, employeeId, dateOfJoining, employeeSalary, 
      birthday, profileImage, status, acceptPolicies, appraisalDate, 
      personalInformation, emergencyContact, bankInformation, 
      identityInformation, education, experience 
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Sanitize Data
    const sanitizedRole = role ? role.toLowerCase() : "employee";
    
    // Helper to clean dates
    const cleanDate = (date) => (date ? date : undefined);

    const user = await User.create({
      name,
      lastName,
      email: trimmedEmail,
      password: hashedPassword,
      role: sanitizedRole,
      status: status || "Active",
    });

    // Clean nested arrays
    const cleanEducation = (education || []).map(edu => ({
      ...edu,
      startYear: edu.startYear || undefined,
      endYear: edu.endYear || undefined
    }));

    const cleanExperience = (experience || []).map(exp => ({
      ...exp,
      startDate: cleanDate(exp.startDate),
      endDate: cleanDate(exp.endDate)
    }));

    const employee = await Employee.create({
      name,
      lastName,
      email: trimmedEmail,
      password: hashedPassword,
      role: sanitizedRole,
      superAdmin: superAdmin || false,
      assignRole,
      designation,
      tl: tl === "" ? null : tl,
      manager: manager === "" ? null : manager,
      address,
      gender,
      employeeId,
      dateOfJoining: cleanDate(dateOfJoining) || Date.now(),
      employeeSalary: employeeSalary || undefined,
      birthday: cleanDate(birthday),
      profileImage,
      status: status || "Active",
      acceptPolicies: acceptPolicies || false,
      appraisalDate: cleanDate(appraisalDate),
      
      personalInformation: personalInformation || { telephones: [] },
      emergencyContact: emergencyContact || { primary: { phone: [] }, secondary: { phone: [] } },
      bankInformation: bankInformation || {},
      identityInformation: identityInformation || {},
      education: cleanEducation,
      experience: cleanExperience,
    });

    const token = jwt.sign(
      { 
        id: employee._id, 
        name: employee.name, 
        email: employee.email,
        designation: employee.designation,
        tl: employee.tl 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...employeeData } = employee.toObject();

    const io = req.app.get("io");
    if (io) {
      if (employee.tl) {
        io.to(`TEAM_${employee.tl}`).emit("newEmployee", { employee: employeeData });
      } else if (employee._id) {
        // If they are a TL themselves (though unlikely on signup), they might have a room
        io.to(`TEAM_${employee._id}`).emit("newEmployee", { employee: employeeData });
      }
      
      if (employee.manager) io.to(String(employee.manager)).emit("newEmployee", { employee: employeeData });
    }

    res.status(201).json({
      message: "Signup successfully",
      user: employeeData,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const trimmedEmail = email.trim();

    const user = await Employee.findOne({
      email: { $regex: `^${trimmedEmail}$`, $options: "i" },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "User is not active" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        designation: user.designation,
        tl: user.tl 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...employee } = user.toObject();

    res.json({ message: "Login successfully", user: employee, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/**
 * ======================
 * LOGOUT
 * ======================
 */
router.post("/logout", auth, async (req, res) => {
  try {
    let token = req.header("x-auth-token");

    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }
    }

    await BlackList.create({ token });

    res.status(200).json({ message: "You have logout successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
