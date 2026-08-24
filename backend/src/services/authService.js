const bcrypt = require("bcryptjs");
const { Role } = require("@prisma/client");

const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { generateAccessToken } = require("../utils/auth");
const { serializeUser } = require("../utils/serializers");
const { validateLoginPayload, validateRegisterPayload } = require("../validators/authValidator");

const register = async (payload) => {
  const validatedPayload = validateRegisterPayload(payload);
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedPayload.email },
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(validatedPayload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: validatedPayload.name,
      email: validatedPayload.email,
      password: hashedPassword,
      role: Role.STUDENT,
    },
  });

  return {
    user: serializeUser(user),
  };
};

const login = async (payload) => {
  const validatedPayload = validateLoginPayload(payload);
  const user = await prisma.user.findUnique({
    where: { email: validatedPayload.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(validatedPayload.password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    user: serializeUser(user),
    accessToken: generateAccessToken(user),
  };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    user: serializeUser(user),
  };
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
