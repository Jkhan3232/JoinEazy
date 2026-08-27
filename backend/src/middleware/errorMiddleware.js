const { Prisma } = require("@prisma/client");

const AppError = require("../utils/AppError");
const logger = require("../config/logger");

const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new AppError("A record with this value already exists", 409);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2021", "P2022"].includes(error.code)
  ) {
    return new AppError(
      "The database needs an update. Please contact the administrator and try again shortly.",
      503,
    );
  }

  return new AppError("Internal server error", 500);
};

const notFoundHandler = (_req, _res, next) => {
  next(new AppError("Route not found", 404));
};

const errorHandler = (error, _req, res, _next) => {
  const normalizedError = normalizeError(error);

  if (normalizedError.statusCode >= 500) {
    logger.error("Unhandled server error", { error });
  } else if (normalizedError.statusCode === 403) {
    logger.warn("Authorization failure", {
      method: _req.method,
      path: _req.originalUrl,
      message: normalizedError.message,
    });
  }

  res.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    ...(normalizedError.details ? { details: normalizedError.details } : {}),
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
