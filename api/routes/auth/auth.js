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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1️⃣ Check USERS collection
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create USER (AUTH TABLE)
    const user = await User.create({
      name,
      email: trimmedEmail,
      password: hashedPassword,
      role: "employee",
      status: "Active",
    });

    // 4️⃣ Create EMPLOYEE (HR TABLE) ✅ MATCHES YOUR SCHEMA
    const employee = await Employee.create({
      name,
      email: trimmedEmail,
      password: hashedPassword,
      role: "employee",
      status: "Active",
      acceptPolicies: false,

      personalInformation: {
        telephones: [],
      },
      emergencyContact: {
        primary: { phone: [] },
        secondary: { phone: [] },
      },
      education: [],
      experience: [],
    });

    // 5️⃣ Token (KEEP CONSISTENT)
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "10h" }
    );

    const { password: _, ...employeeData } = employee.toObject();

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



/**
 * ======================
 * LOGIN (UNCHANGED)
 * ======================
 */
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
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "10h" }
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
