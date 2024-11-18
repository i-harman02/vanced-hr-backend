const dotenv = require("dotenv").config();
const env = process.env;
module.exports = {
  PRODUCTION_PORT: env.PORT,
  DATABASE: env.DATABASE,
  JWT_SECRET: env.JWT_SECRET,
};
