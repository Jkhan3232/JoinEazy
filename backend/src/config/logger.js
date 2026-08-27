const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const { combine, timestamp, errors, json, colorize, printf, splat } =
  winston.format;

const isProduction = process.env.NODE_ENV === "production";
const logDir = process.env.LOG_DIR || "logs";

// Renders meta as "key=value key2=value2" instead of a JSON object
const formatMeta = (meta) => {
  const keys = Object.keys(meta);
  if (keys.length === 0) return "";
  return (
    " " +
    keys
      .map((key) => {
        const val = meta[key];
        const str = typeof val === "object" ? JSON.stringify(val) : val;
        return `${key}=${str}`;
      })
      .join(" ")
  );
};

const consoleFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  splat(),
  colorize({ all: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    return `${timestamp} [${level}]: ${stack || message}${formatMeta(meta)}`;
  }),
);

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json(),
);

const transports = [
  new winston.transports.Console({
    format: isProduction ? fileFormat : consoleFormat,
  }),
];

if (isProduction) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
      format: fileFormat,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      zippedArchive: true,
      format: fileFormat,
    }),
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  defaultMeta: {
    service: process.env.SERVICE_NAME || "api",
    environment: process.env.NODE_ENV || "development",
  },

  format: fileFormat,
  transports,

  // Catch uncaught exceptions & unhandled promise rejections too
  exceptionHandlers: [
    new winston.transports.Console({
      format: isProduction ? fileFormat : consoleFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: isProduction ? fileFormat : consoleFormat,
    }),
  ],

  exitOnError: false,
});

module.exports = logger;
