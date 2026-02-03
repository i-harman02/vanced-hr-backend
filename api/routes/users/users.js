const express = require("express");
const router = express.Router();

const auth = require("../../helpers/auth");
const Employee = require("../../../models/employee");

/**
 * GET logged-in user (AUTH + BASIC PROFILE)
 * GET /api/users/me
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await Employee.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * (OPTIONAL) Alias endpoint
 * GET /api/users/me/employee
 */
router.get("/me/employee", auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id).select("-password");

    if (!employee) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
