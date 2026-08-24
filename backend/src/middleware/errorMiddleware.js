const { Prisma } = require("@prisma/client");

const AppError = require("../utils/AppError");

const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new AppError("A record with this value already exists", 409);
  }

  return new AppError("Internal server error", 500);
};

const notFoundHandler = (_req, _res, next) => {
  next(new AppError("Route not found", 404));
};

const errorHandler = (error, _req, res, _next) => {
  const normalizedError = normalizeError(error);

  if (process.env.NODE_ENV !== "test" && normalizedError.statusCode === 500) {
    console.error(error);
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
