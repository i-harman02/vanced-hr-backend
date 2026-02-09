const jwt = require("jsonwebtoken");
const config = require("../../config");
const { JWT_SECRET } = config;
const BlackList = require("../../models/blackList");

const auth = async (req, res, next) => {
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

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const checkIfBlacklisted = await BlackList.findOne({ token });
  if (checkIfBlacklisted) {
    return res
      .status(401)
      .json({ message: "This session has expired. Please login" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ NORMALIZED USER OBJECT
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = auth;
