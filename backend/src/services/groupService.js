const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const {
  ensureStudentAvailableForGroup,
  getCurrentGroupMembership,
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
  assignments: true,
  submissions: true,
};

const formatGroup = (group) => ({
  id: group.id,
  name: group.name,
  createdBy: group.createdBy,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
  members: group.members.map((member) => ({
    id: member.id,
    joinedAt: member.joinedAt,
    student: member.student,
  })),
  assignmentCount: group.assignments?.length || 0,
  submissionCount: group.submissions?.length || 0,
});

const ensureStudentCanViewGroup = async (user, groupId) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  if (user.role === "ADMIN") {
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
    throw new AppError("Only the group creator can manage members", 403);
  }

  return group;
};

const createGroup = async ({ user, payload }) => {
  const validatedPayload = validateCreateGroupPayload(payload);

  await ensureStudentAvailableForGroup(user.id);

  const group = await prisma.group.create({
    data: {
      name: validatedPayload.name,
      createdById: user.id,
      members: {
        create: {
          studentId: user.id,
        },
      },
    },
    include: groupInclude,
  });

  return formatGroup(group);
};

const getGroups = async (user) => {
  const groups =
    user.role === "ADMIN"
      ? await prisma.group.findMany({
          include: groupInclude,
          orderBy: {
            createdAt: "desc",
          },
        })
      : await prisma.group.findMany({
          where: {
            members: {
              some: {
                studentId: user.id,
              },
            },
          },
          include: groupInclude,
          orderBy: {
            createdAt: "desc",
          },
        });

  return groups.map(formatGroup);
};

const getGroupById = async ({ user, groupId }) => {
  const group = await ensureStudentCanViewGroup(user, groupId);
  return formatGroup(group);
};

const addMember = async ({ user, groupId, payload }) => {
  await ensureStudentCanManageGroup(user.id, groupId);
  const { identifier, mode } = validateAddMemberPayload(payload);

  const student = await prisma.user.findFirst({
    where: mode === "email" ? { email: identifier } : { id: identifier },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (student.role !== "STUDENT") {
    throw new AppError("Admins cannot be added to groups", 400);
  }

  await ensureStudentAvailableForGroup(student.id, groupId);

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

  return formatGroup(updatedGroup);
};

const removeMember = async ({ user, groupId, studentId }) => {
  const group = await ensureStudentCanManageGroup(user.id, groupId);

  if (group.createdById === studentId) {
    throw new AppError("The group creator cannot be removed from the group", 400);
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

  return formatGroup(updatedGroup);
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
  removeMember,
};
