const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const generateAccessToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

module.exports = {
  generateAccessToken,
};
