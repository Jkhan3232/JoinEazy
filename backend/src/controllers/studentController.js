const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const dashboardService = require("../services/dashboardService");

const getAssignments = catchAsync(async (req, res) => {
  const assignments = await dashboardService.getStudentAssignments(req.user.id);

  sendSuccess(res, {
    message: "Student assignments fetched successfully",
    data: assignments,
  });
});

const getDashboard = catchAsync(async (req, res) => {
  const dashboard = await dashboardService.getStudentDashboard(req.user.id);

  sendSuccess(res, {
    message: "Student dashboard fetched successfully",
    data: dashboard,
  });
});

module.exports = {
  getAssignments,
  getDashboard,
};
