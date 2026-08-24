const { SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { normalizeAssignmentPayload, validateGroupIdsPayload } = require("../validators/assignmentValidator");
const { getCurrentGroupMembership, safeUserSelect } = require("./sharedService");

const assignmentInclude = {
  createdBy: {
    select: safeUserSelect,
  },
  assignmentGroups: {
    include: {
      group: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
  },
  submissions: {
    include: {
      confirmedBy: {
        select: safeUserSelect,
      },
      group: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
};

const ensureAssignmentExists = async (assignmentId) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: assignmentInclude,
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  return assignment;
};

const formatAssignmentSummary = (assignment) => ({
  id: assignment.id,
  title: assignment.title,
  description: assignment.description,
  dueDate: assignment.dueDate,
  oneDriveLink: assignment.oneDriveLink,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt,
  createdBy: assignment.createdBy,
  assignedGroups: assignment.assignmentGroups.map((item) => ({
    id: item.group.id,
    name: item.group.name,
    assignedAt: item.assignedAt,
  })),
  submissions: assignment.submissions.map((submission) => ({
    id: submission.id,
    status: submission.status,
    confirmedAt: submission.confirmedAt,
    group: {
      id: submission.group.id,
      name: submission.group.name,
    },
    confirmedBy: submission.confirmedBy,
  })),
});

const createAssignment = async ({ user, payload }) => {
  const validatedPayload = normalizeAssignmentPayload(payload);

  const assignment = await prisma.assignment.create({
    data: {
      ...validatedPayload,
      createdById: user.id,
    },
    include: assignmentInclude,
  });

  return formatAssignmentSummary(assignment);
};

const updateAssignment = async ({ assignmentId, payload }) => {
  await ensureAssignmentExists(assignmentId);
  const validatedPayload = normalizeAssignmentPayload(payload);

  const assignment = await prisma.assignment.update({
    where: { id: assignmentId },
    data: validatedPayload,
    include: assignmentInclude,
  });

  return formatAssignmentSummary(assignment);
};

const getAssignments = async () => {
  const assignments = await prisma.assignment.findMany({
    include: assignmentInclude,
    orderBy: {
      dueDate: "asc",
    },
  });

  return assignments.map(formatAssignmentSummary);
};

const getAssignmentById = async ({ assignmentId, user }) => {
  const assignment = await ensureAssignmentExists(assignmentId);

  if (user.role === "ADMIN") {
    return formatAssignmentSummary(assignment);
  }

  const membership = await getCurrentGroupMembership(user.id, { required: true });
  const isAssignedToGroup = assignment.assignmentGroups.some(
    (item) => item.groupId === membership.groupId,
  );

  if (!isAssignedToGroup) {
    throw new AppError("This assignment is not assigned to your group", 403);
  }

  const submission = assignment.submissions.find((item) => item.groupId === membership.groupId);

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    oneDriveLink: assignment.oneDriveLink,
    group: {
      id: membership.group.id,
      name: membership.group.name,
    },
    submission: submission
      ? {
          id: submission.id,
          status: submission.status,
          confirmedAt: submission.confirmedAt,
          confirmedBy: submission.confirmedBy,
        }
      : {
          status: SubmissionStatus.PENDING,
          confirmedAt: null,
          confirmedBy: null,
        },
  };
};

const assignToGroups = async (assignmentId, rawGroupIds) => {
  await ensureAssignmentExists(assignmentId);
  const groupIds = [...new Set(rawGroupIds)];

  const groups = await prisma.group.findMany({
    where: {
      id: {
        in: groupIds,
      },
    },
  });

  if (groups.length !== groupIds.length) {
    throw new AppError("One or more groups do not exist", 404);
  }

  const assignmentGroupResult = await prisma.assignmentGroup.createMany({
    data: groupIds.map((groupId) => ({
      assignmentId,
      groupId,
    })),
    skipDuplicates: true,
  });

  const submissionResult = await prisma.submission.createMany({
    data: groupIds.map((groupId) => ({
      assignmentId,
      groupId,
      status: SubmissionStatus.PENDING,
    })),
    skipDuplicates: true,
  });

  return {
    assignmentId,
    assignedGroupCount: groupIds.length,
    newAssignmentGroupRecords: assignmentGroupResult.count,
    newSubmissionRecords: submissionResult.count,
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
    })),
  };
};

const assignToAllGroups = async (assignmentId) => {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
    },
  });

  if (!groups.length) {
    throw new AppError("No groups found to assign this assignment to", 400);
  }

  return assignToGroups(
    assignmentId,
    groups.map((group) => group.id),
  );
};

const assignToSelectedGroups = async ({ assignmentId, payload }) => {
  const groupIds = validateGroupIdsPayload(payload);
  return assignToGroups(assignmentId, groupIds);
};

const confirmSubmission = async ({ user, assignmentId }) => {
  const membership = await getCurrentGroupMembership(user.id, { required: true });
  await ensureAssignmentExists(assignmentId);

  const assignmentGroup = await prisma.assignmentGroup.findUnique({
    where: {
      assignmentId_groupId: {
        assignmentId,
        groupId: membership.groupId,
      },
    },
  });

  if (!assignmentGroup) {
    throw new AppError("This assignment is not assigned to your group", 403);
  }

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_groupId: {
        assignmentId,
        groupId: membership.groupId,
      },
    },
  });

  if (existingSubmission?.status === SubmissionStatus.CONFIRMED) {
    throw new AppError("This submission has already been confirmed", 409);
  }

  const submission = existingSubmission
    ? await prisma.submission.update({
        where: {
          assignmentId_groupId: {
            assignmentId,
            groupId: membership.groupId,
          },
        },
        data: {
          status: SubmissionStatus.CONFIRMED,
          confirmedById: user.id,
          confirmedAt: new Date(),
        },
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
          group: true,
          assignment: true,
        },
      })
    : await prisma.submission.create({
        data: {
          assignmentId,
          groupId: membership.groupId,
          status: SubmissionStatus.CONFIRMED,
          confirmedById: user.id,
          confirmedAt: new Date(),
        },
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
          group: true,
          assignment: true,
        },
      });

  return {
    id: submission.id,
    status: submission.status,
    confirmedAt: submission.confirmedAt,
    assignment: {
      id: submission.assignment.id,
      title: submission.assignment.title,
    },
    group: {
      id: submission.group.id,
      name: submission.group.name,
    },
    confirmedBy: submission.confirmedBy,
  };
};

const getSubmissionStatus = async ({ user, assignmentId, groupId }) => {
  await ensureAssignmentExists(assignmentId);

  if (user.role === "STUDENT") {
    const membership = await getCurrentGroupMembership(user.id, { required: true });
    const submission = await prisma.submission.findUnique({
      where: {
        assignmentId_groupId: {
          assignmentId,
          groupId: membership.groupId,
        },
      },
      include: {
        confirmedBy: {
          select: safeUserSelect,
        },
      },
    });

    return {
      group: {
        id: membership.group.id,
        name: membership.group.name,
      },
      submission: submission
        ? {
            id: submission.id,
            status: submission.status,
            confirmedAt: submission.confirmedAt,
            confirmedBy: submission.confirmedBy,
          }
        : {
            status: SubmissionStatus.PENDING,
            confirmedAt: null,
            confirmedBy: null,
          },
    };
  }

  const whereClause = groupId
    ? {
        assignmentId_groupId: {
          assignmentId,
          groupId,
        },
      }
    : null;

  if (whereClause) {
    const submission = await prisma.submission.findUnique({
      where: whereClause,
      include: {
        confirmedBy: {
          select: safeUserSelect,
        },
        group: true,
      },
    });

    if (!submission) {
      throw new AppError("Submission status not found for this group", 404);
    }

    return {
      assignmentId,
      groups: [
        {
          group: {
            id: submission.group.id,
            name: submission.group.name,
          },
          status: submission.status,
          confirmedAt: submission.confirmedAt,
          confirmedBy: submission.confirmedBy,
        },
      ],
    };
  }

  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    include: {
      confirmedBy: {
        select: safeUserSelect,
      },
      group: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    assignmentId,
    groups: submissions.map((submission) => ({
      group: {
        id: submission.group.id,
        name: submission.group.name,
      },
      status: submission.status,
      confirmedAt: submission.confirmedAt,
      confirmedBy: submission.confirmedBy,
    })),
  };
};

module.exports = {
  createAssignment,
  updateAssignment,
  getAssignments,
  getAssignmentById,
  assignToAllGroups,
  assignToSelectedGroups,
  confirmSubmission,
  getSubmissionStatus,
};
