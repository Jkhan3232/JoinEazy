const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const dashboardService = require("../services/dashboardService");

const getDashboard = catchAsync(async (_req, res) => {
  const dashboard = await dashboardService.getAdminDashboard();

  sendSuccess(res, {
    message: "Admin dashboard fetched successfully",
    data: dashboard,
  });
});

const getAnalytics = catchAsync(async (_req, res) => {
  const analytics = await dashboardService.getAdminAnalytics();

  sendSuccess(res, {
    message: "Admin analytics fetched successfully",
    data: analytics,
  });
});

const getGroups = catchAsync(async (_req, res) => {
  const groups = await dashboardService.getAdminGroups();

  sendSuccess(res, {
    message: "Admin groups fetched successfully",
    data: groups,
  });
});

const getStudents = catchAsync(async (_req, res) => {
  const students = await dashboardService.getAdminStudents();

  sendSuccess(res, {
    message: "Admin students fetched successfully",
    data: students,
  });
});

module.exports = {
  getDashboard,
  getAnalytics,
  getGroups,
  getStudents,
};
