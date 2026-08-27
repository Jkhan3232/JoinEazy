const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const {
  safeUserSelect,
  calculateCompletionPercentage,
} = require("./sharedService");

const courseInclude = {
  professor: { select: safeUserSelect },
  enrollments: { select: { studentId: true } },
  assignments: {
    include: { submissions: true },
    orderBy: { dueDate: "asc" },
  },
};

const validateCoursePayload = (payload) => {
  const name = String(payload.name || "").trim();
  const code = String(payload.code || "")
    .trim()
    .toUpperCase();
  const description = String(payload.description || "").trim();

  if (!name || !code || !description) {
    throw new AppError("Course name, code, and description are required", 400);
  }

  return { name, code, description };
};

const formatCourse = (course) => {
  const submissions = course.assignments.flatMap(
    (assignment) => assignment.submissions,
  );
  const acknowledged = submissions.filter((submission) =>
    ["ACKNOWLEDGED", "CONFIRMED"].includes(submission.status),
  ).length;

  return {
    id: course.id,
    name: course.name,
    code: course.code,
    description: course.description,
    professor: course.professor,
    studentCount: course.enrollments.length,
    assignmentCount: course.assignments.length,
    completionPercentage: calculateCompletionPercentage(
      acknowledged,
      submissions.length,
    ),
    assignments: course.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      submissionType: assignment.submissionType,
      submissionCount: assignment.submissions.length,
      acknowledgedCount: assignment.submissions.filter((submission) =>
        ["ACKNOWLEDGED", "CONFIRMED"].includes(submission.status),
      ).length,
    })),
  };
};

const ensureCourse = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: courseInclude,
  });
  if (!course) throw new AppError("Course not found", 404);
  return course;
};

const createCourse = async ({ user, payload }) => {
  const data = validateCoursePayload(payload);
  const course = await prisma.course.create({
    data: { ...data, professorId: user.id },
    include: courseInclude,
  });
  return formatCourse(course);
};

const updateCourse = async ({ user, courseId, payload }) => {
  const course = await ensureCourse(courseId);
  if (course.professor.id !== user.id)
    throw new AppError("You do not own this course", 403);
  const updated = await prisma.course.update({
    where: { id: courseId },
    data: validateCoursePayload(payload),
    include: courseInclude,
  });
  return formatCourse(updated);
};

const getCourse = async ({ user, courseId }) => {
  const course = await ensureCourse(courseId);
  if (
    user.role === "STUDENT" &&
    !course.enrollments.some((item) => item.studentId === user.id)
  ) {
    throw new AppError("You are not enrolled in this course", 403);
  }
  return formatCourse(course);
};

const getAdminCourses = async (user) => {
  const courses = await prisma.course.findMany({
    where: { professorId: user.id },
    include: courseInclude,
    orderBy: { createdAt: "desc" },
  });
  return courses.map(formatCourse);
};

const getStudentCourses = async (studentId) => {
  const courses = await prisma.course.findMany({
    where: { enrollments: { some: { studentId } } },
    include: courseInclude,
    orderBy: { name: "asc" },
  });
  return courses.map(formatCourse);
};

const enrollStudent = async ({ user, courseId, studentId }) => {
  const course = await ensureCourse(courseId);
  if (course.professor.id !== user.id)
    throw new AppError("You do not own this course", 403);
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });
  if (!student || student.role !== "STUDENT")
    throw new AppError("Student not found", 404);
  await prisma.studentCourse.create({ data: { courseId, studentId } });
  return { courseId, studentId };
};

module.exports = {
  createCourse,
  updateCourse,
  getCourse,
  getAdminCourses,
  getStudentCourses,
  enrollStudent,
};
