const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const courseService = require("../services/courseService");

const getCourses = catchAsync(async (req, res) => {
  const courses =
    req.user.role === "STUDENT"
      ? await courseService.getStudentCourses(req.user.id)
      : await courseService.getAdminCourses(req.user);
  sendSuccess(res, { message: "Courses fetched successfully", data: courses });
});

const getCourse = catchAsync(async (req, res) => {
  const course = await courseService.getCourse({
    user: req.user,
    courseId: req.params.id,
  });
  sendSuccess(res, { message: "Course fetched successfully", data: course });
});

const createCourse = catchAsync(async (req, res) => {
  const course = await courseService.createCourse({
    user: req.user,
    payload: req.body,
  });
  sendSuccess(res, {
    statusCode: 201,
    message: "Course created successfully",
    data: course,
  });
});

const updateCourse = catchAsync(async (req, res) => {
  const course = await courseService.updateCourse({
    user: req.user,
    courseId: req.params.id,
    payload: req.body,
  });
  sendSuccess(res, { message: "Course updated successfully", data: course });
});

const enrollStudent = catchAsync(async (req, res) => {
  const enrollment = await courseService.enrollStudent({
    user: req.user,
    courseId: req.params.id,
    studentId: req.body.studentId,
  });
  sendSuccess(res, {
    statusCode: 201,
    message: "Student enrolled successfully",
    data: enrollment,
  });
});

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  enrollStudent,
};
