const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true,
});

const jwtSecret = process.env.JWT_SECRET || "";

if (process.env.NODE_ENV === "production" && !jwtSecret) {
  throw new Error("JWT_SECRET must be configured in production");
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: jwtSecret || "local-development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  logLevel: process.env.LOG_LEVEL || "info",
};

module.exports = {
  env,
};
