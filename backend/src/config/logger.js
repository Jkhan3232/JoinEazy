const fs = require("fs");
const path = require("path");
const winston = require("winston");
const morgan = require("morgan");
require("winston-daily-rotate-file");

const { combine, timestamp, errors, json, colorize, printf, splat } =
  winston.format;

/**
 * Environment
 */
const NODE_ENV = (process.env.NODE_ENV || "development").toLowerCase();

const isProduction = NODE_ENV === "production";

/**
 * Logger configuration
 */
const LOG_DIR = process.env.LOG_DIR || "logs";
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || "20m";
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || "14d";

/**
 * Format metadata for development console
 *
 * Example:
 * userId=123 method=GET statusCode=200
 */
const formatMeta = (meta) => {
  const keys = Object.keys(meta);

  if (keys.length === 0) {
    return "";
  }

  return (
    " " +
    keys
      .map((key) => {
        const value = meta[key];

        if (value === undefined || value === null) {
          return `${key}=${value}`;
        }

        const formattedValue =
          typeof value === "object" ? JSON.stringify(value) : String(value);

        return `${key}=${formattedValue}`;
      })
      .join(" ")
  );
};

/**
 * Development console format
 *
 * Example:
 * 2026-08-28 05:30:10 [info]: Server started port=5000
 */
const developmentConsoleFormat = combine(
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),

  errors({
    stack: true,
  }),

  splat(),

  colorize({
    all: true,
  }),

  printf(({ timestamp, level, message, stack, ...meta }) => {
    const output = stack || message;

    return `${timestamp} [${level}]: ${output}${formatMeta(meta)}`;
  }),
);

/**
 * Production console format
 *
 * JSON is better for Docker / Railway / Render / AWS / Vercel logs.
 */
const productionConsoleFormat = combine(
  timestamp(),

  errors({
    stack: true,
  }),

  splat(),

  json(),
);

/**
 * File format
 *
 * Logs are stored as JSON so they can easily be
 * consumed by monitoring/logging systems.
 */
const fileFormat = combine(
  timestamp(),

  errors({
    stack: true,
  }),

  splat(),

  json(),
);

/**
 * Winston transports
 */
const transports = [
  new winston.transports.Console({
    format: isProduction ? productionConsoleFormat : developmentConsoleFormat,
  }),
];

/**
 * Production file logging
 */
const canUseFileLogging = (() => {
  if (!isProduction) {
    return false;
  }

  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.accessSync(LOG_DIR, fs.constants.W_OK);
    return true;
  } catch (_error) {
    return false;
  }
})();

if (canUseFileLogging) {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      zippedArchive: true,
      format: fileFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: LOG_MAX_SIZE,
      maxFiles: "30d",
      zippedArchive: true,
      format: fileFormat,
    }),
  );
}

/**
 * Create logger
 */
const logger = winston.createLogger({
  level: LOG_LEVEL,

  defaultMeta: {
    service: process.env.SERVICE_NAME || "api",

    environment: NODE_ENV,
  },

  format: fileFormat,

  transports,

  /**
   * Handle uncaught exceptions
   */
  exceptionHandlers: [
    new winston.transports.Console({
      format: isProduction ? productionConsoleFormat : developmentConsoleFormat,
    }),
  ],

  /**
   * Handle unhandled promise rejections
   */
  rejectionHandlers: [
    new winston.transports.Console({
      format: isProduction ? productionConsoleFormat : developmentConsoleFormat,
    }),
  ],

  /**
   * Don't automatically terminate application
   */
  exitOnError: false,
});

/**
 * Morgan request ID
 */
morgan.token("id", (req) => req.id || "-");

/**
 * Morgan format
 */
const morganFormat =
  ":id :remote-addr :method :url :status :res[content-length] - :response-time ms";

/**
 * Morgan middleware
 */
const morganInstance = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim(), {
        type: "http",
      });
    },
  },
});

/**
 * Export
 */
module.exports = logger;

module.exports.morganInstance = morganInstance;
