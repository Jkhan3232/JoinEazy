const { SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { normalizeAssignmentPayload, validateGroupIdsPayload } = require("../validators/assignmentValidator");
const { getCurrentGroupMembership, safeUserSelect } = require("./sharedService");

const assignmentInclude = {
  createdBy: {
    select: safeUserSelect,
  },
  course: true,
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
      student: {
        select: safeUserSelect,
      },
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
  submissionType: assignment.submissionType,
  course: assignment.course,
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
    student: submission.student,
    confirmedBy: submission.confirmedBy,
  })),
});

const createAssignment = async ({ user, payload }) => {
  const validatedPayload = normalizeAssignmentPayload(payload);

  if (validatedPayload.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: validatedPayload.courseId },
    });
    if (!course) throw new AppError("Course not found", 404);
    if (course.professorId !== user.id)
      throw new AppError("You do not own this course", 403);
  }

  const assignment = await prisma.assignment.create({
    data: {
      ...validatedPayload,
      createdById: user.id,
    },
    include: assignmentInclude,
  });

  return formatAssignmentSummary(assignment);
};

const updateAssignment = async ({ user, assignmentId, payload }) => {
  const existingAssignment = await ensureAssignmentExists(assignmentId);
  const validatedPayload = normalizeAssignmentPayload(payload);

  if (existingAssignment.createdBy.id !== user.id) {
    throw new AppError("You do not own this assignment", 403);
  }
  if (validatedPayload.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: validatedPayload.courseId },
    });
    if (!course) throw new AppError("Course not found", 404);
    if (course.professorId !== user.id) {
      throw new AppError("You do not own this course", 403);
    }
  }

  const assignment = await prisma.assignment.update({
    where: { id: assignmentId },
    data: validatedPayload,
    include: assignmentInclude,
  });

  return formatAssignmentSummary(assignment);
};

const deleteAssignment = async ({ user, assignmentId }) => {
  const assignment = await ensureAssignmentExists(assignmentId);

  if (assignment.createdBy.id !== user.id) {
    throw new AppError("You do not own this assignment", 403);
  }

  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  return { id: assignmentId };
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

  if (assignment.submissionType === "INDIVIDUAL" && assignment.courseId) {
    const enrollment = await prisma.studentCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId: assignment.courseId,
        },
      },
    });
    if (!enrollment)
      throw new AppError("You are not enrolled in this course", 403);
    const submission = assignment.submissions.find(
      (item) => item.studentId === user.id,
    );
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      oneDriveLink: assignment.oneDriveLink,
      submissionType: assignment.submissionType,
      course: assignment.course,
      isGroupLeader: false,
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

  const membership = await getCurrentGroupMembership(user.id, { required: true });
  const isAssignedToGroup = assignment.assignmentGroups.some(
    (item) => item.groupId === membership.groupId,
  );

  if (!isAssignedToGroup) {
    throw new AppError("This assignment is not assigned to your group", 403);
  }

  const submission = assignment.submissions.find((item) =>
    assignment.submissionType === "INDIVIDUAL"
      ? item.studentId === user.id
      : item.groupId === membership.groupId,
  );

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    oneDriveLink: assignment.oneDriveLink,
    submissionType: assignment.submissionType,
    isGroupLeader: membership.group.createdById === user.id,
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

  const assignment = await ensureAssignmentExists(assignmentId);
  const groups = await prisma.group.findMany({
    where: {
      id: {
        in: groupIds,
      },
    },
    include: {
      members: true,
    },
  });

  if (groups.length !== groupIds.length) {
    throw new AppError("One or more groups do not exist", 404);
  }

  const { assignmentGroupResult, submissionResult } = await prisma.$transaction(
    async (transaction) => {
      const createdAssignmentGroups =
        await transaction.assignmentGroup.createMany({
          data: groupIds.map((groupId) => ({
            assignmentId,
            groupId,
          })),
          skipDuplicates: true,
        });

      const submissionData =
        assignment.submissionType === "INDIVIDUAL"
          ? groups.flatMap((group) =>
              group.members.map((member) => ({
                assignmentId,
                groupId: group.id,
                studentId: member.studentId,
                status: SubmissionStatus.PENDING,
              })),
            )
          : groupIds.map((groupId) => ({
              assignmentId,
              groupId,
              status: SubmissionStatus.PENDING,
            }));
      const createdSubmissions = await transaction.submission.createMany({
        data: submissionData,
        skipDuplicates: true,
      });

      return {
        assignmentGroupResult: createdAssignmentGroups,
        submissionResult: createdSubmissions,
      };
    },
  );

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
  const assignment = await ensureAssignmentExists(assignmentId);

  if (assignment.submissionType === "INDIVIDUAL") {
    if (assignment.courseId) {
      const enrollment = await prisma.studentCourse.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.id,
            courseId: assignment.courseId,
          },
        },
      });
      if (!enrollment) {
        throw new AppError("You are not enrolled in this course", 403);
      }
    }

    const existingSubmission = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
    });

    if (!existingSubmission) {
      throw new AppError("Individual submission not found", 404);
    }
    if (
      [SubmissionStatus.CONFIRMED, SubmissionStatus.ACKNOWLEDGED].includes(
        existingSubmission.status,
      )
    ) {
      throw new AppError("This submission has already been confirmed", 409);
    }

    const submission = await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        status: SubmissionStatus.ACKNOWLEDGED,
        confirmedById: user.id,
        confirmedAt: new Date(),
      },
      include: {
        confirmedBy: { select: safeUserSelect },
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
      group: { id: submission.group.id, name: submission.group.name },
      confirmedBy: submission.confirmedBy,
    };
  }

  const membership = await getCurrentGroupMembership(user.id, { required: true });

  if (membership.group.createdById !== user.id) {
    throw new AppError(
      "Only the group leader can confirm this submission",
      403,
    );
  }

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

  const existingSubmission = await prisma.submission.findFirst({
    where: { assignmentId, groupId: membership.groupId, studentId: null },
  });

  if (
    [SubmissionStatus.CONFIRMED, SubmissionStatus.ACKNOWLEDGED].includes(
      existingSubmission?.status,
    )
  ) {
    throw new AppError("This submission has already been confirmed", 409);
  }

  const submission = existingSubmission
    ? await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          status: SubmissionStatus.ACKNOWLEDGED,
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
          status: SubmissionStatus.ACKNOWLEDGED,
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

const submitAssignment = async ({ user, assignmentId }) => {
  const assignment = await ensureAssignmentExists(assignmentId);
  if (assignment.submissionType === "INDIVIDUAL" && assignment.courseId) {
    const enrollment = await prisma.studentCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId: assignment.courseId,
        },
      },
    });
    if (!enrollment)
      throw new AppError("You are not enrolled in this course", 403);
  }
  if (assignment.submissionType === "GROUP") {
    const membership = await getCurrentGroupMembership(user.id, {
      required: true,
    });
    if (
      !assignment.assignmentGroups.some(
        (item) => item.groupId === membership.groupId,
      )
    ) {
      throw new AppError("This assignment is not assigned to your group", 403);
    }
  }
  const where =
    assignment.submissionType === "INDIVIDUAL"
      ? { assignmentId_studentId: { assignmentId, studentId: user.id } }
      : {
          assignmentId: assignmentId,
          groupId: (
            await getCurrentGroupMembership(user.id, { required: true })
          ).groupId,
          studentId: null,
        };
  const submission =
    assignment.submissionType === "INDIVIDUAL"
      ? await prisma.submission.findUnique({ where })
      : await prisma.submission.findFirst({ where });
  if (!submission)
    throw new AppError("Submission not found for this assignment", 404);
  if (
    [SubmissionStatus.CONFIRMED, SubmissionStatus.ACKNOWLEDGED].includes(
      submission.status,
    )
  ) {
    throw new AppError("This submission has already been acknowledged", 409);
  }
  return prisma.submission.update({
    where: { id: submission.id },
    data: { status: SubmissionStatus.SUBMITTED },
  });
};

const getSubmissionStatus = async ({ user, assignmentId, groupId }) => {
  await ensureAssignmentExists(assignmentId);

  if (user.role === "STUDENT") {
    const assignment = await ensureAssignmentExists(assignmentId);

    if (assignment.submissionType === "INDIVIDUAL") {
      const submission = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
        include: { confirmedBy: { select: safeUserSelect } },
      });

      return {
        group: null,
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

    const membership = await getCurrentGroupMembership(user.id, {
      required: true,
    });
    const submission = await prisma.submission.findFirst({
      where: { assignmentId, groupId: membership.groupId, studentId: null },
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
    ? { assignmentId, groupId, studentId: null }
    : null;

  if (whereClause) {
    const submission = await prisma.submission.findFirst({
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

const getAssignmentSubmissions = async ({ user, assignmentId, status }) => {
  const assignment = await ensureAssignmentExists(assignmentId);

  if (assignment.createdBy.id !== user.id) {
    throw new AppError("You do not own this assignment", 403);
  }

  const allowedStatuses = ["PENDING", "SUBMITTED", "ACKNOWLEDGED", "CONFIRMED"];
  if (status && !allowedStatuses.includes(status)) {
    throw new AppError("Invalid submission status", 400);
  }

  const submissions = await prisma.submission.findMany({
    where: { assignmentId, ...(status ? { status } : {}) },
    include: {
      group: true,
      student: { select: safeUserSelect },
      confirmedBy: { select: safeUserSelect },
    },
    orderBy: { createdAt: "asc" },
  });

  return submissions.map((submission) => ({
    id: submission.id,
    status: submission.status,
    confirmedAt: submission.confirmedAt,
    group: submission.group
      ? { id: submission.group.id, name: submission.group.name }
      : null,
    student: submission.student,
    confirmedBy: submission.confirmedBy,
  }));
};

module.exports = {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  getAssignmentById,
  assignToAllGroups,
  assignToSelectedGroups,
  confirmSubmission,
  submitAssignment,
  getSubmissionStatus,
  getAssignmentSubmissions,
};
