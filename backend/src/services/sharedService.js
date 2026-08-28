const { SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const groupMembershipInclude = {
  group: {
    include: {
      createdBy: {
        select: safeUserSelect,
      },
      members: {
        include: {
          student: {
            select: safeUserSelect,
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  },
};

const completedStatuses = [
  SubmissionStatus.ACKNOWLEDGED,
  SubmissionStatus.CONFIRMED,
];

const calculateCompletionPercentage = (completed, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
};

const getProgressLabel = (completed, total) => {
  if (!total || completed === 0) {
    return "Not Started";
  }

  if (completed === total) {
    return "Completed";
  }

  return "In Progress";
};

const ensureStudentEnrolledInCourse = async (studentId, courseId) => {
  const enrollment = await prisma.studentCourse.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError("You are not enrolled in this course", 403);
  }

  return enrollment;
};

const ensureProfessorOwnsCourse = async (professorId, courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (course.professorId !== professorId) {
    throw new AppError("You do not own this course", 403);
  }

  return course;
};

const getStudentGroupMemberships = async (studentId) =>
  prisma.groupMember.findMany({
    where: { studentId },
    include: groupMembershipInclude,
    orderBy: {
      joinedAt: "asc",
    },
  });

const getGroupMembershipByCourse = async (
  studentId,
  courseId,
  { required = false } = {},
) => {
  const memberships = await getStudentGroupMemberships(studentId);
  const membership =
    memberships.find((item) => item.group?.courseId === courseId) ||
    memberships[0] ||
    null;

  if (!membership && required) {
    throw new AppError("You are not part of a group for this course yet", 404);
  }

  return membership;
};

const getGroupMembershipByGroupId = async (
  studentId,
  groupId,
  { required = false } = {},
) => {
  const membership = await prisma.groupMember.findFirst({
    where: {
      studentId,
      groupId,
    },
    include: groupMembershipInclude,
  });

  if (!membership && required) {
    throw new AppError("You are not part of this group", 403);
  }

  return membership;
};

const getRelevantGroupMembershipForAssignment = async (
  studentId,
  assignment,
  { required = false } = {},
) => {
  const assignmentGroupIds = assignment.assignmentGroups.map((item) => item.groupId);
  const memberships = await getStudentGroupMemberships(studentId);

  const membership =
    memberships.find((item) => assignmentGroupIds.includes(item.groupId)) ||
    (assignment.courseId
      ? await getGroupMembershipByCourse(studentId, assignment.courseId)
      : null);

  if (!membership && required) {
    throw new AppError("You are not part of the required group for this assignment", 403);
  }

  return membership;
};

const ensureStudentAvailableForGroup = async (
  studentId,
  courseId,
  groupId = null,
) => {
  const existingMembership = await prisma.groupMember.findFirst({
    where: {
      studentId,
      ...(groupId
        ? {
            groupId: {
              not: groupId,
            },
          }
        : {}),
    },
  });

  if (existingMembership && existingMembership.groupId !== groupId) {
    throw new AppError("Student is already a member of another group", 409);
  }
};

module.exports = {
  safeUserSelect,
  groupMembershipInclude,
  completedStatuses,
  calculateCompletionPercentage,
  getProgressLabel,
  ensureStudentEnrolledInCourse,
  ensureProfessorOwnsCourse,
  getStudentGroupMemberships,
  getGroupMembershipByCourse,
  getGroupMembershipByGroupId,
  getRelevantGroupMembershipForAssignment,
  ensureStudentAvailableForGroup,
};
