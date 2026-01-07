const express = require("express");
const router = express.Router();
const config = require("../../../config");
const Employee = require("../../../models/employee");
const { JWT_SECRET } = config;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const BlackList = require("../../../models/blackList");
const auth = require("../../helpers/auth");

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const trimmedEmail = email.trim();
    const atCount = (trimmedEmail.match(/@/g) || []).length;

    if (atCount !== 1) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await Employee.findOne({
      email: { $regex: `^${trimmedEmail}$`, $options: "i" },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Employee({
      name,
      email: trimmedEmail,
      password: hashedPassword,
      status: "Active",
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.userName },
      JWT_SECRET,
      { expiresIn: "10h" }
    );

    const { password: _, ...employee } = newUser.toObject();

    res.status(201).json({
      message: "Signup successfully",
      data: employee,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Something went wrong",
    });
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
    const atCount = (trimmedEmail.match(/@/g) || []).length;

    if (atCount !== 1) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = await Employee.findOne({
      email: { $regex: `^${trimmedEmail}$`, $options: "i" },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "User is not active" });
    }

    // ✅ Password match
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // ✅ Create token
    const token = jwt.sign(
      { id: user._id, username: user.userName },
      JWT_SECRET,
      { expiresIn: "10sec" }
    );

    const { password: _, ...employee } = user.toObject();

    res.json({ message: "Login successfully", user: employee, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    let token = req.header("x-auth-token");

    if (!token) {
      // If x-auth-token header is not present, check for Authorization header
      const authHeader = req.header("Authorization");
      if (authHeader) {
        // Get the token from the Authorization header
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }
    }
    const newBlackListedToken = new BlackList({
      token,
    });
    await newBlackListedToken.save();
    res.status(200).json({
      message: "You have logout successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
module.exports = router;
