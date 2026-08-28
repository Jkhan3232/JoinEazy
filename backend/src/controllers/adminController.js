const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const dashboardService = require("../services/dashboardService");

const getDashboard = catchAsync(async (req, res) => {
  const dashboard = await dashboardService.getAdminDashboard(req.user);

  sendSuccess(res, {
    message: "Professor dashboard fetched successfully",
    data: dashboard,
  });
});

const getAnalytics = catchAsync(async (req, res) => {
  const analytics = await dashboardService.getAdminAnalytics(req.user);

  sendSuccess(res, {
    message: "Professor analytics fetched successfully",
    data: analytics,
  });
});

const getGroups = catchAsync(async (req, res) => {
  const groups = await dashboardService.getAdminGroups(req.user);

  sendSuccess(res, {
    message: "Professor groups fetched successfully",
    data: groups,
  });
});

const getStudents = catchAsync(async (req, res) => {
  const students = await dashboardService.getAdminStudents(req.user);

  sendSuccess(res, {
    message: "Professor students fetched successfully",
    data: students,
  });
});

module.exports = {
  getDashboard,
  getAnalytics,
  getGroups,
  getStudents,
};
