const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const { env } = require("../config/env");
const AppError = require("../utils/AppError");
const { serializeUser } = require("../utils/serializers");

const authenticate = () => async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return next(new AppError("Authentication required", 401));
    }

    const token = authorization.replace("Bearer ", "").trim();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.user = serializeUser(user);
    return next();
  } catch (_error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError("You do not have permission to access this resource", 403));
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
};
