const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const {
  completedStatuses,
  ensureProfessorOwnsCourse,
  ensureStudentAvailableForGroup,
  ensureStudentEnrolledInCourse,
  safeUserSelect,
} = require("./sharedService");
const { validateAddMemberPayload, validateCreateGroupPayload } = require("../validators/groupValidator");

const groupInclude = {
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
  assignments: {
    select: {
      id: true,
    },
  },
  submissions: {
    select: {
      id: true,
      status: true,
    },
  },
};

const formatGroup = (group, userId = null) => {
  const acknowledgedSubmissionCount = group.submissions.filter((submission) =>
    completedStatuses.includes(submission.status),
  ).length;

  return {
    id: group.id,
    name: group.name,
    courseId: group.courseId || null,
    course: null,
    leaderId: group.createdById,
    leader: group.createdBy,
    createdBy: group.createdBy,
    isLeader: userId ? group.createdById === userId : undefined,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    members: group.members.map((member) => ({
      id: member.id,
      joinedAt: member.joinedAt,
      student: member.student,
    })),
    assignmentCount: group.assignments.length,
    submissionCount: group.submissions.length,
    acknowledgedSubmissionCount,
    pendingSubmissionCount: group.submissions.length - acknowledgedSubmissionCount,
  };
};

const ensureUserCanViewGroup = async (user, groupId) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  if (user.role === "PROFESSOR") {
    return group;
  }

  const isMember = group.members.some((member) => member.student.id === user.id);

  if (!isMember) {
    throw new AppError("You do not have permission to access this group", 403);
  }

  return group;
};

const ensureStudentCanManageGroup = async (userId, groupId) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  if (group.createdById !== userId) {
    throw new AppError("Only the group leader can manage members", 403);
  }

  return group;
};

const createGroup = async ({ user, payload }) => {
  const validatedPayload = validateCreateGroupPayload(payload);

  await ensureStudentEnrolledInCourse(user.id, validatedPayload.courseId);
  await ensureStudentAvailableForGroup(user.id, validatedPayload.courseId);

  const group = await prisma.$transaction(async (transaction) => {
    const createdGroup = await transaction.group.create({
      data: {
        name: validatedPayload.name,
        courseId: validatedPayload.courseId,
        createdById: user.id,
      },
    });

    await transaction.groupMember.create({
      data: {
        groupId: createdGroup.id,
        studentId: user.id,
      },
    });

    return transaction.group.findUnique({
      where: { id: createdGroup.id },
      include: groupInclude,
    });
  });

  logger.info("Group created", {
    groupId: group.id,
    courseId: group.courseId,
    leaderId: user.id,
  });

  return formatGroup(group, user.id);
};

const getGroups = async (user) => {
  const where =
    user.role === "PROFESSOR"
      ? {}
      : {
          members: {
            some: {
              studentId: user.id,
            },
          },
        };

  const groups = await prisma.group.findMany({
    where,
    include: groupInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return groups.map((group) => formatGroup(group, user.id));
};

const getGroupById = async ({ user, groupId }) => {
  const group = await ensureUserCanViewGroup(user, groupId);
  return formatGroup(group, user.id);
};

const addMember = async ({ user, groupId, payload }) => {
  const group = await ensureStudentCanManageGroup(user.id, groupId);
  const { identifier, mode } = validateAddMemberPayload(payload);

  const student = await prisma.user.findFirst({
    where: mode === "email" ? { email: identifier } : { id: identifier },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (student.role !== "STUDENT") {
    throw new AppError("Professors cannot be added to student groups", 400);
  }

  await ensureStudentAvailableForGroup(student.id, group.courseId, groupId);

  const duplicateMember = await prisma.groupMember.findUnique({
    where: {
      groupId_studentId: {
        groupId,
        studentId: student.id,
      },
    },
  });

  if (duplicateMember) {
    throw new AppError("Student is already a member of this group", 409);
  }

  await prisma.groupMember.create({
    data: {
      groupId,
      studentId: student.id,
    },
  });

  const updatedGroup = await prisma.group.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  logger.info("Group member added", {
    groupId,
    leaderId: user.id,
    studentId: student.id,
  });

  return formatGroup(updatedGroup, user.id);
};

const removeMember = async ({ user, groupId, studentId }) => {
  const group = await ensureStudentCanManageGroup(user.id, groupId);

  if (group.createdById === studentId) {
    throw new AppError("The group leader cannot be removed from the group", 400);
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_studentId: {
        groupId,
        studentId,
      },
    },
  });

  if (!membership) {
    throw new AppError("Student is not a member of this group", 404);
  }

  await prisma.groupMember.delete({
    where: {
      groupId_studentId: {
        groupId,
        studentId,
      },
    },
  });

  const updatedGroup = await prisma.group.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  logger.info("Group member removed", {
    groupId,
    leaderId: user.id,
    studentId,
  });

  return formatGroup(updatedGroup, user.id);
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
  removeMember,
};
