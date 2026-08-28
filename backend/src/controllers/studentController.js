const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const dashboardService = require("../services/dashboardService");
const assignmentService = require("../services/assignmentService");

const getAssignments = catchAsync(async (req, res) => {
  const assignments = await dashboardService.getStudentAssignments(req.user.id);

  sendSuccess(res, {
    message: "Student assignments fetched successfully",
    data: assignments,
  });
});

const getAssignmentById = catchAsync(async (req, res) => {
  const assignment = await assignmentService.getAssignmentById({
    assignmentId: req.params.id,
    user: req.user,
  });

  sendSuccess(res, {
    message: "Student assignment fetched successfully",
    data: assignment,
  });
});

const getDashboard = catchAsync(async (req, res) => {
  const dashboard = await dashboardService.getStudentDashboard(req.user.id);

  sendSuccess(res, {
    message: "Student dashboard fetched successfully",
    data: dashboard,
  });
});

const getCourses = catchAsync(async (req, res) => {
  const courses = await dashboardService.getStudentCourses(req.user.id);
  sendSuccess(res, {
    message: "Student courses fetched successfully",
    data: courses,
  });
});

module.exports = {
  getAssignments,
  getAssignmentById,
  getDashboard,
  getCourses,
};
