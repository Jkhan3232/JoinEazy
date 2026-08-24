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

const getCurrentGroupMembership = async (studentId, { required = false } = {}) => {
  const membership = await prisma.groupMember.findFirst({
    where: { studentId },
    include: {
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
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  if (!membership && required) {
    throw new AppError("Student is not part of any group yet", 404);
  }

  return membership;
};

const ensureStudentAvailableForGroup = async (studentId, groupId = null) => {
  const existingMembership = await prisma.groupMember.findFirst({
    where: { studentId },
  });

  if (existingMembership && existingMembership.groupId !== groupId) {
    throw new AppError("Student is already a member of another group", 409);
  }
};

module.exports = {
  safeUserSelect,
  calculateCompletionPercentage,
  getProgressLabel,
  getCurrentGroupMembership,
  ensureStudentAvailableForGroup,
};
