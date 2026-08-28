const { SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const logger = require("../config/logger");
const AppError = require("../utils/AppError");
const { normalizeAssignmentPayload, validateGroupIdsPayload } = require("../validators/assignmentValidator");
const {
  completedStatuses,
  ensureProfessorOwnsCourse,
  ensureStudentEnrolledInCourse,
  getRelevantGroupMembershipForAssignment,
  safeUserSelect,
} = require("./sharedService");

const assignmentInclude = {
  createdBy: {
    select: safeUserSelect,
  },
  course: {
    include: {
      professor: {
        select: safeUserSelect,
      },
    },
  },
  assignmentGroups: {
    include: {
      group: {
        include: {
          course: true,
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

const completedOrAcknowledgedStatuses = [
  SubmissionStatus.CONFIRMED,
  SubmissionStatus.ACKNOWLEDGED,
];

const getSubmissionProgress = (status) => {
  if (completedStatuses.includes(status)) {
    return 100;
  }

  if (status === SubmissionStatus.SUBMITTED) {
    return 65;
  }

  return 0;
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

const ensureProfessorOwnsAssignment = (assignment, professorId) => {
  const ownsAssignment =
    assignment.createdById === professorId || assignment.course?.professorId === professorId;

  if (!ownsAssignment) {
    throw new AppError("You do not own this assignment", 403);
  }
};

const formatSubmissionSummary = (submission) => ({
  id: submission.id,
  status: submission.status,
  progress: getSubmissionProgress(submission.status),
  acknowledgedAt: submission.confirmedAt,
  confirmedAt: submission.confirmedAt,
  group: submission.group
    ? {
        id: submission.group.id,
        name: submission.group.name,
      }
    : null,
  student: submission.student,
  acknowledgedBy: submission.confirmedBy,
  confirmedBy: submission.confirmedBy,
});

const formatAssignmentSummary = (assignment) => ({
  id: assignment.id,
  title: assignment.title,
  description: assignment.description,
  deadline: assignment.dueDate,
  dueDate: assignment.dueDate,
  oneDriveLink: assignment.oneDriveLink,
  submissionType: assignment.submissionType,
  course: assignment.course
    ? {
        id: assignment.course.id,
        name: assignment.course.name,
        code: assignment.course.code,
        description: assignment.course.description,
        professor: assignment.course.professor,
      }
    : null,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt,
  createdBy: assignment.createdBy,
  assignedGroups: assignment.assignmentGroups.map((item) => ({
    id: item.group.id,
    name: item.group.name,
    courseId: item.group.courseId,
    assignedAt: item.assignedAt,
    leader: item.group.createdBy,
    memberCount: item.group.members.length,
  })),
  submissions: assignment.submissions.map(formatSubmissionSummary),
});

const syncIndividualAssignmentSubmissions = async (assignment, transaction) => {
  if (!assignment.courseId) {
    return;
  }

  const enrollments = await transaction.studentCourse.findMany({
    where: {
      courseId: assignment.courseId,
    },
    select: {
      studentId: true,
    },
  });

  const enrolledStudentIds = enrollments.map((enrollment) => enrollment.studentId);

  await transaction.assignmentGroup.deleteMany({
    where: {
      assignmentId: assignment.id,
    },
  });

  await transaction.submission.deleteMany({
    where: {
      assignmentId: assignment.id,
      studentId: null,
    },
  });

  await transaction.submission.deleteMany({
    where: {
      assignmentId: assignment.id,
      studentId: {
        notIn: enrolledStudentIds.length ? enrolledStudentIds : ["__no_students__"],
      },
    },
  });

  if (!enrolledStudentIds.length) {
    return;
  }

  await transaction.submission.createMany({
    data: enrolledStudentIds.map((studentId) => ({
      assignmentId: assignment.id,
      studentId,
      groupId: null,
      status: SubmissionStatus.PENDING,
    })),
    skipDuplicates: true,
  });
};

const syncGroupAssignmentTargets = async (assignment, transaction) => {
  await transaction.submission.deleteMany({
    where: {
      assignmentId: assignment.id,
      studentId: {
        not: null,
      },
    },
  });

  if (!assignment.courseId) {
    return;
  }

  const validGroups = await transaction.group.findMany({
    where: {
      courseId: assignment.courseId,
    },
    select: {
      id: true,
    },
  });

  const validGroupIds = validGroups.map((group) => group.id);

  await transaction.assignmentGroup.deleteMany({
    where: {
      assignmentId: assignment.id,
      ...(validGroupIds.length
        ? {
            groupId: {
              notIn: validGroupIds,
            },
          }
        : {}),
    },
  });

  await transaction.submission.deleteMany({
    where: {
      assignmentId: assignment.id,
      studentId: null,
      ...(validGroupIds.length
        ? {
            groupId: {
              notIn: validGroupIds,
            },
          }
        : {}),
    },
  });
};

const createAssignment = async ({ user, payload }) => {
  const validatedPayload = normalizeAssignmentPayload(payload);

  await ensureProfessorOwnsCourse(user.id, validatedPayload.courseId);

  const assignment = await prisma.$transaction(async (transaction) => {
    const createdAssignment = await transaction.assignment.create({
      data: {
        title: validatedPayload.title,
        description: validatedPayload.description,
        dueDate: validatedPayload.dueDate,
        oneDriveLink: validatedPayload.oneDriveLink,
        submissionType: validatedPayload.submissionType,
        courseId: validatedPayload.courseId,
        createdById: user.id,
      },
    });

    if (validatedPayload.submissionType === "INDIVIDUAL") {
      await syncIndividualAssignmentSubmissions(createdAssignment, transaction);
    }

    return transaction.assignment.findUnique({
      where: {
        id: createdAssignment.id,
      },
      include: assignmentInclude,
    });
  });

  logger.info("Assignment created", {
    assignmentId: assignment.id,
    courseId: assignment.courseId,
    professorId: user.id,
    submissionType: assignment.submissionType,
  });

  return formatAssignmentSummary(assignment);
};

const updateAssignment = async ({ user, assignmentId, payload }) => {
  const existingAssignment = await ensureAssignmentExists(assignmentId);
  ensureProfessorOwnsAssignment(existingAssignment, user.id);

  const validatedPayload = normalizeAssignmentPayload(payload);
  await ensureProfessorOwnsCourse(user.id, validatedPayload.courseId);

  const assignment = await prisma.$transaction(async (transaction) => {
    const updatedAssignment = await transaction.assignment.update({
      where: { id: assignmentId },
      data: {
        title: validatedPayload.title,
        description: validatedPayload.description,
        dueDate: validatedPayload.dueDate,
        oneDriveLink: validatedPayload.oneDriveLink,
        submissionType: validatedPayload.submissionType,
        courseId: validatedPayload.courseId,
      },
    });

    if (updatedAssignment.submissionType === "INDIVIDUAL") {
      await syncIndividualAssignmentSubmissions(updatedAssignment, transaction);
    } else {
      await syncGroupAssignmentTargets(updatedAssignment, transaction);
    }

    return transaction.assignment.findUnique({
      where: { id: assignmentId },
      include: assignmentInclude,
    });
  });

  logger.info("Assignment updated", {
    assignmentId,
    courseId: assignment.courseId,
    professorId: user.id,
    submissionType: assignment.submissionType,
  });

  return formatAssignmentSummary(assignment);
};

const deleteAssignment = async ({ user, assignmentId }) => {
  const assignment = await ensureAssignmentExists(assignmentId);
  ensureProfessorOwnsAssignment(assignment, user.id);

  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  logger.info("Assignment deleted", {
    assignmentId,
    professorId: user.id,
  });

  return { id: assignmentId };
};

const getAssignments = async (user) => {
  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        {
          createdById: user.id,
        },
        {
          course: {
            professorId: user.id,
          },
        },
      ],
    },
    include: assignmentInclude,
    orderBy: {
      dueDate: "asc",
    },
  });

  return assignments.map(formatAssignmentSummary);
};

const getStudentAssignmentView = async (assignment, user) => {
  if (assignment.courseId) {
    await ensureStudentEnrolledInCourse(user.id, assignment.courseId);
  }

  if (assignment.submissionType === "INDIVIDUAL") {
    const submission =
      assignment.submissions.find((item) => item.studentId === user.id) || null;
    const status = submission?.status || SubmissionStatus.PENDING;

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.dueDate,
      dueDate: assignment.dueDate,
      oneDriveLink: assignment.oneDriveLink,
      submissionType: assignment.submissionType,
      course: assignment.course
        ? {
            id: assignment.course.id,
            name: assignment.course.name,
            code: assignment.course.code,
            description: assignment.course.description,
            professor: assignment.course.professor,
          }
        : null,
      group: null,
      isGroupLeader: false,
      submissionStatus: status,
      status,
      progress: getSubmissionProgress(status),
      acknowledgedAt: submission?.confirmedAt || null,
      confirmedAt: submission?.confirmedAt || null,
      acknowledgedBy: submission?.confirmedBy || null,
      confirmedBy: submission?.confirmedBy || null,
      submission: {
        id: submission?.id || null,
        status,
        progress: getSubmissionProgress(status),
        acknowledgedAt: submission?.confirmedAt || null,
        confirmedAt: submission?.confirmedAt || null,
        acknowledgedBy: submission?.confirmedBy || null,
        confirmedBy: submission?.confirmedBy || null,
      },
    };
  }

  const membership = await getRelevantGroupMembershipForAssignment(user.id, assignment, {
    required: true,
  });
  const isAssignedToGroup = assignment.assignmentGroups.some(
    (item) => item.groupId === membership.groupId,
  );

  if (!isAssignedToGroup) {
    throw new AppError("This assignment is not assigned to your group", 403);
  }

  const submission =
    assignment.submissions.find(
      (item) => item.groupId === membership.groupId && item.studentId === null,
    ) || null;
  const status = submission?.status || SubmissionStatus.PENDING;

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    deadline: assignment.dueDate,
    dueDate: assignment.dueDate,
    oneDriveLink: assignment.oneDriveLink,
    submissionType: assignment.submissionType,
    course: assignment.course
      ? {
          id: assignment.course.id,
          name: assignment.course.name,
          code: assignment.course.code,
          description: assignment.course.description,
          professor: assignment.course.professor,
        }
      : null,
    group: {
      id: membership.group.id,
      name: membership.group.name,
      leaderId: membership.group.createdById,
      leader: membership.group.createdBy,
      members: membership.group.members.map((member) => ({
        id: member.id,
        joinedAt: member.joinedAt,
        student: member.student,
      })),
    },
    isGroupLeader: membership.group.createdById === user.id,
    submissionStatus: status,
    status,
    progress: getSubmissionProgress(status),
    acknowledgedAt: submission?.confirmedAt || null,
    confirmedAt: submission?.confirmedAt || null,
    acknowledgedBy: submission?.confirmedBy || null,
    confirmedBy: submission?.confirmedBy || null,
    submission: {
      id: submission?.id || null,
      status,
      progress: getSubmissionProgress(status),
      acknowledgedAt: submission?.confirmedAt || null,
      confirmedAt: submission?.confirmedAt || null,
      acknowledgedBy: submission?.confirmedBy || null,
      confirmedBy: submission?.confirmedBy || null,
    },
  };
};

const getAssignmentById = async ({ assignmentId, user }) => {
  const assignment = await ensureAssignmentExists(assignmentId);

  if (user.role === "PROFESSOR") {
    ensureProfessorOwnsAssignment(assignment, user.id);
    return formatAssignmentSummary(assignment);
  }

  return getStudentAssignmentView(assignment, user);
};

const assignToGroups = async ({ user, assignmentId, rawGroupIds }) => {
  const assignment = await ensureAssignmentExists(assignmentId);
  ensureProfessorOwnsAssignment(assignment, user.id);

  if (assignment.submissionType !== "GROUP") {
    throw new AppError(
      "Individual assignments are automatically assigned to enrolled students",
      400,
    );
  }

  const groupIds = [...new Set(rawGroupIds)];
  const groups = await prisma.group.findMany({
    where: {
      id: {
        in: groupIds,
      },
      ...(assignment.courseId
        ? {
            courseId: assignment.courseId,
          }
        : {}),
    },
    include: {
      course: true,
      members: true,
    },
  });

  if (groups.length !== groupIds.length) {
    throw new AppError(
      "One or more groups do not exist or do not belong to this course",
      404,
    );
  }

  const { assignmentGroupResult, submissionResult } = await prisma.$transaction(
    async (transaction) => {
      const createdAssignmentGroups = await transaction.assignmentGroup.createMany({
        data: groupIds.map((groupId) => ({
          assignmentId,
          groupId,
        })),
        skipDuplicates: true,
      });

      const createdSubmissions = await transaction.submission.createMany({
        data: groupIds.map((groupId) => ({
          assignmentId,
          groupId,
          studentId: null,
          status: SubmissionStatus.PENDING,
        })),
        skipDuplicates: true,
      });

      return {
        assignmentGroupResult: createdAssignmentGroups,
        submissionResult: createdSubmissions,
      };
    },
  );

  logger.info("Assignment allocated to groups", {
    assignmentId,
    groupCount: groupIds.length,
    professorId: user.id,
  });

  return {
    assignmentId,
    assignedGroupCount: groupIds.length,
    newAssignmentGroupRecords: assignmentGroupResult.count,
    newSubmissionRecords: submissionResult.count,
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      courseId: group.courseId,
    })),
  };
};

const assignToAllGroups = async ({ user, assignmentId }) => {
  const assignment = await ensureAssignmentExists(assignmentId);
  ensureProfessorOwnsAssignment(assignment, user.id);

  const groups = await prisma.group.findMany({
    where: assignment.courseId
      ? {
          courseId: assignment.courseId,
        }
      : undefined,
    select: {
      id: true,
    },
  });

  if (!groups.length) {
    throw new AppError("No groups found for this course", 400);
  }

  return assignToGroups({
    user,
    assignmentId,
    rawGroupIds: groups.map((group) => group.id),
  });
};

const assignToSelectedGroups = async ({ user, assignmentId, payload }) => {
  const groupIds = validateGroupIdsPayload(payload);
  return assignToGroups({
    user,
    assignmentId,
    rawGroupIds: groupIds,
  });
};

const createOrUpdateIndividualSubmission = async ({ user, assignmentId, status }) => {
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: user.id,
      },
    },
  });

  if (
    existingSubmission &&
    completedOrAcknowledgedStatuses.includes(existingSubmission.status)
  ) {
    throw new AppError("This submission has already been acknowledged", 409);
  }

  if (existingSubmission) {
    return prisma.submission.update({
      where: { id: existingSubmission.id },
      data:
        status === SubmissionStatus.ACKNOWLEDGED
          ? {
              status,
              confirmedById: user.id,
              confirmedAt: new Date(),
            }
          : {
              status,
            },
      include: {
        confirmedBy: {
          select: safeUserSelect,
        },
        assignment: true,
      },
    });
  }

  return prisma.submission.create({
    data: {
      assignmentId,
      studentId: user.id,
      groupId: null,
      status,
      ...(status === SubmissionStatus.ACKNOWLEDGED
        ? {
            confirmedById: user.id,
            confirmedAt: new Date(),
          }
        : {}),
    },
    include: {
      confirmedBy: {
        select: safeUserSelect,
      },
      assignment: true,
    },
  });
};

const confirmSubmission = async ({ user, assignmentId }) => {
  const assignment = await ensureAssignmentExists(assignmentId);

  if (assignment.submissionType === "INDIVIDUAL") {
    if (assignment.courseId) {
      await ensureStudentEnrolledInCourse(user.id, assignment.courseId);
    }

    const submission = await createOrUpdateIndividualSubmission({
      user,
      assignmentId,
      status: SubmissionStatus.ACKNOWLEDGED,
    });

    logger.info("Individual submission acknowledged", {
      assignmentId,
      studentId: user.id,
    });

    return {
      id: submission.id,
      status: submission.status,
      acknowledgedAt: submission.confirmedAt,
      confirmedAt: submission.confirmedAt,
      assignment: {
        id: submission.assignment.id,
        title: submission.assignment.title,
      },
      group: null,
      acknowledgedBy: submission.confirmedBy,
      confirmedBy: submission.confirmedBy,
    };
  }

  const membership = await getRelevantGroupMembershipForAssignment(user.id, assignment, {
    required: true,
  });

  if (membership.group.createdById !== user.id) {
    logger.warn("Unauthorized group acknowledgement attempt", {
      assignmentId,
      studentId: user.id,
      groupId: membership.groupId,
    });
    throw new AppError("Only the group leader can acknowledge a group assignment.", 403);
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
    where: {
      assignmentId,
      groupId: membership.groupId,
      studentId: null,
    },
  });

  if (
    existingSubmission &&
    completedOrAcknowledgedStatuses.includes(existingSubmission.status)
  ) {
    throw new AppError("This submission has already been acknowledged", 409);
  }

  const submission = existingSubmission
    ? await prisma.submission.update({
        where: {
          id: existingSubmission.id,
        },
        data: {
          status: SubmissionStatus.ACKNOWLEDGED,
          confirmedById: user.id,
          confirmedAt: new Date(),
        },
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
          assignment: true,
          group: true,
        },
      })
    : await prisma.submission.create({
        data: {
          assignmentId,
          groupId: membership.groupId,
          studentId: null,
          status: SubmissionStatus.ACKNOWLEDGED,
          confirmedById: user.id,
          confirmedAt: new Date(),
        },
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
          assignment: true,
          group: true,
        },
      });

  logger.info("Group submission acknowledged", {
    assignmentId,
    groupId: membership.groupId,
    leaderId: user.id,
  });

  return {
    id: submission.id,
    status: submission.status,
    acknowledgedAt: submission.confirmedAt,
    confirmedAt: submission.confirmedAt,
    assignment: {
      id: submission.assignment.id,
      title: submission.assignment.title,
    },
    group: submission.group
      ? {
          id: submission.group.id,
          name: submission.group.name,
        }
      : null,
    acknowledgedBy: submission.confirmedBy,
    confirmedBy: submission.confirmedBy,
  };
};

const submitAssignment = async ({ user, assignmentId }) => {
  const assignment = await ensureAssignmentExists(assignmentId);

  if (assignment.submissionType === "INDIVIDUAL") {
    if (assignment.courseId) {
      await ensureStudentEnrolledInCourse(user.id, assignment.courseId);
    }

    const submission = await createOrUpdateIndividualSubmission({
      user,
      assignmentId,
      status: SubmissionStatus.SUBMITTED,
    });

    logger.info("Individual submission marked submitted", {
      assignmentId,
      studentId: user.id,
    });

    return formatSubmissionSummary(submission);
  }

  const membership = await getRelevantGroupMembershipForAssignment(user.id, assignment, {
    required: true,
  });

  if (membership.group.createdById !== user.id) {
    throw new AppError("Only the group leader can mark this group assignment as submitted", 403);
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
    where: {
      assignmentId,
      groupId: membership.groupId,
      studentId: null,
    },
    include: {
      confirmedBy: {
        select: safeUserSelect,
      },
    },
  });

  if (
    existingSubmission &&
    completedOrAcknowledgedStatuses.includes(existingSubmission.status)
  ) {
    throw new AppError("This submission has already been acknowledged", 409);
  }

  const submission = existingSubmission
    ? await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          status: SubmissionStatus.SUBMITTED,
        },
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
        },
      })
    : await prisma.submission.create({
        data: {
          assignmentId,
          groupId: membership.groupId,
          studentId: null,
          status: SubmissionStatus.SUBMITTED,
        },
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
        },
      });

  logger.info("Group submission marked submitted", {
    assignmentId,
    groupId: membership.groupId,
    leaderId: user.id,
  });

  return formatSubmissionSummary(submission);
};

const getSubmissionStatus = async ({ user, assignmentId, groupId }) => {
  const assignment = await ensureAssignmentExists(assignmentId);

  if (user.role === "STUDENT") {
    return getStudentAssignmentView(assignment, user);
  }

  ensureProfessorOwnsAssignment(assignment, user.id);

  if (groupId) {
    const submission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        groupId,
      },
      include: {
        confirmedBy: {
          select: safeUserSelect,
        },
        group: true,
        student: {
          select: safeUserSelect,
        },
      },
    });

    if (!submission) {
      throw new AppError("Submission status not found", 404);
    }

    return formatSubmissionSummary(submission);
  }

  return {
    assignmentId,
    submissions: assignment.submissions.map(formatSubmissionSummary),
  };
};

const getAssignmentSubmissions = async ({ user, assignmentId, status }) => {
  const assignment = await ensureAssignmentExists(assignmentId);
  ensureProfessorOwnsAssignment(assignment, user.id);

  const allowedStatuses = ["PENDING", "SUBMITTED", "ACKNOWLEDGED", "CONFIRMED"];

  if (status && !allowedStatuses.includes(status)) {
    throw new AppError("Invalid submission status", 400);
  }

  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      ...(status ? { status } : {}),
    },
    include: {
      group: true,
      student: {
        select: safeUserSelect,
      },
      confirmedBy: {
        select: safeUserSelect,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return submissions.map(formatSubmissionSummary);
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
