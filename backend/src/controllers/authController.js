const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const authService = require("../services/authService");

const register = catchAsync(async (req, res) => {
  const data = await authService.register(req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: "Student registered successfully",
    data,
  });
});

const login = catchAsync(async (req, res) => {
  const data = await authService.login(req.body);

  sendSuccess(res, {
    message: "Login successful",
    data,
  });
});

const getCurrentUser = catchAsync(async (req, res) => {
  const data = await authService.getCurrentUser(req.user.id);

  sendSuccess(res, {
    message: "Current user fetched successfully",
    data,
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
};
