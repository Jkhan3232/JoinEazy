const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const courseService = require("../services/courseService");

const getCourses = catchAsync(async (req, res) => {
  const courses = await courseService.getAccessibleCourses(req.user);

  sendSuccess(res, {
    message: "Courses fetched successfully",
    data: courses,
  });
});

const getCourseById = catchAsync(async (req, res) => {
  const course = await courseService.getCourseById({
    user: req.user,
    courseId: req.params.id,
  });

  sendSuccess(res, {
    message: "Course fetched successfully",
    data: course,
  });
});

const getCourseAssignments = catchAsync(async (req, res) => {
  const assignments = await courseService.getCourseAssignments({
    user: req.user,
    courseId: req.params.id,
  });

  sendSuccess(res, {
    message: "Course assignments fetched successfully",
    data: assignments,
  });
});

module.exports = {
  getCourses,
  getCourseById,
  getCourseAssignments,
};
