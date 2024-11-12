const express = require("express");
const router = express.Router();
const config = require("../../../config");
const Employee = require("../../../models/employee");
const { JWT_SECRET } = config;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const BlackList = require("../../../models/blackList");
const auth = require("../../helpers/auth");

router.post("/login", async (req, res) => {
  try {
    const { userName, password, email } = req.body;

    // Check if username exists
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.userName },
      JWT_SECRET,
      {
        expiresIn: "10h",
      }
    );

    const { password: _, ...employee } = user.toObject();

    res.json({ message: "Login successfully", user: employee, token });
  } catch (error) {
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
