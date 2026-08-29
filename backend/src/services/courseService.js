const { SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { validateCoursePayload } = require("../validators/courseValidator");
const {
  calculateCompletionPercentage,
  completedStatuses,
  ensureProfessorOwnsCourse,
  ensureStudentEnrolledInCourse,
  getGroupMembershipByCourse,
  getStudentGroupMemberships,
  getProgressLabel,
  safeUserSelect,
} = require("./sharedService");

const courseStudentInclude = {
  professor: {
    select: safeUserSelect,
  },
  enrollments: {
    select: {
      studentId: true,
    },
  },
  groups: {
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
    orderBy: {
      createdAt: "asc",
    },
  },
  assignments: {
    include: {
      assignmentGroups: {
        select: {
          groupId: true,
        },
      },
      submissions: {
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
          student: {
            select: safeUserSelect,
          },
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  },
};

const courseProfessorInclude = {
  professor: {
    select: safeUserSelect,
  },
  enrollments: {
    select: {
      studentId: true,
      student: {
        select: safeUserSelect,
      },
    },
  },
  groups: {
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
    orderBy: {
      createdAt: "asc",
    },
  },
  assignments: {
    include: {
      assignmentGroups: {
        include: {
          group: true,
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
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  },
};

const getSubmissionProgress = (status) => {
  if (completedStatuses.includes(status)) {
    return 100;
  }

  if (status === SubmissionStatus.SUBMITTED) {
    return 65;
  }

  return 0;
};

const getStudentSubmissionForAssignment = (assignment, studentId, membership) => {
  if (assignment.submissionType === "INDIVIDUAL") {
    return (
      assignment.submissions.find((submission) => submission.studentId === studentId) ||
      null
    );
  }

  if (!membership) {
    return null;
  }

  return (
    assignment.submissions.find(
      (submission) => submission.groupId === membership.groupId && submission.studentId === null,
    ) || null
  );
};

const isStudentAssignmentVisible = (assignment, membership) => {
  if (assignment.submissionType === "INDIVIDUAL") {
    return true;
  }

  if (!membership) {
    return false;
  }

  return assignment.assignmentGroups.some((item) => item.groupId === membership.groupId);
};

const mapStudentAssignment = (assignment, membership, studentId, course) => {
  const submission = getStudentSubmissionForAssignment(assignment, studentId, membership);
  const status = submission?.status || SubmissionStatus.PENDING;

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    deadline: assignment.dueDate,
    dueDate: assignment.dueDate,
    oneDriveLink: assignment.oneDriveLink,
    submissionType: assignment.submissionType,
    submissionStatus: status,
    status,
    progress: getSubmissionProgress(status),
    acknowledgedAt: submission?.confirmedAt || null,
    confirmedAt: submission?.confirmedAt || null,
    acknowledgedBy: submission?.confirmedBy || null,
    confirmedBy: submission?.confirmedBy || null,
    isGroupLeader: Boolean(
      assignment.submissionType === "GROUP" && membership?.group.createdById === studentId,
    ),
    course: {
      id: course.id,
      name: course.name,
      code: course.code,
    },
    group:
      assignment.submissionType === "GROUP" && membership
        ? {
            id: membership.group.id,
            name: membership.group.name,
            leaderId: membership.group.createdById,
            leader: membership.group.createdBy,
            members: membership.group.members.map((member) => ({
              id: member.id,
              joinedAt: member.joinedAt,
              student: member.student,
            })),
          }
        : null,
  };
};

const getStudentCourseSummaries = async (studentId) => {
  const memberships = await getStudentGroupMemberships(studentId);
  const membershipByCourseId = new Map(
    memberships
      .filter((membership) => membership.group.courseId)
      .map((membership) => [membership.group.courseId, membership]),
  );

  const courses = await prisma.course.findMany({
    where: {
      enrollments: {
        some: {
          studentId,
        },
      },
    },
    include: courseStudentInclude,
    orderBy: {
      name: "asc",
    },
  });

  return courses.map((course) => {
    const membership = membershipByCourseId.get(course.id) || null;
    const visibleAssignments = course.assignments.filter((assignment) =>
      isStudentAssignmentVisible(assignment, membership),
    );
    const completedAssignments = visibleAssignments.filter((assignment) => {
      const status = getStudentSubmissionForAssignment(assignment, studentId, membership)?.status;
      return status === SubmissionStatus.SUBMITTED || completedStatuses.includes(status);
    }).length;

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      professor: course.professor,
      studentCount: course.enrollments.length,
      group: membership
        ? {
            id: membership.group.id,
            name: membership.group.name,
            leaderId: membership.group.createdById,
            leader: membership.group.createdBy,
            memberCount: membership.group.members.length,
          }
        : null,
      assignmentCount: visibleAssignments.length,
      totalAssignments: visibleAssignments.length,
      completedAssignments,
      pendingAssignments: visibleAssignments.length - completedAssignments,
      completionPercentage: calculateCompletionPercentage(
        completedAssignments,
        visibleAssignments.length,
      ),
    };
  });
};

const getProfessorCourseSummaries = async (professorId) => {
  const courses = await prisma.course.findMany({
    where: {
      professorId,
    },
    include: courseProfessorInclude,
    orderBy: {
      name: "asc",
    },
  });

  return courses.map((course) => {
    const totalSubmissions = course.assignments.reduce(
      (count, assignment) => count + assignment.submissions.length,
      0,
    );
    const acknowledgedSubmissions = course.assignments.reduce(
      (count, assignment) =>
        count +
        assignment.submissions.filter((submission) =>
          completedStatuses.includes(submission.status),
        ).length,
      0,
    );
    const submittedSubmissions = course.assignments.reduce(
      (count, assignment) =>
        count +
        assignment.submissions.filter(
          (submission) => submission.status === SubmissionStatus.SUBMITTED,
        ).length,
      0,
    );
    const pendingSubmissions = course.assignments.reduce(
      (count, assignment) =>
        count +
        assignment.submissions.filter(
          (submission) => submission.status === SubmissionStatus.PENDING,
        ).length,
      0,
    );

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      professor: course.professor,
      studentCount: course.enrollments.length,
      groupCount: course.groups.length,
      assignmentCount: course.assignments.length,
      totalSubmissions,
      acknowledgedSubmissions,
      confirmedSubmissions: acknowledgedSubmissions,
      submittedSubmissions,
      pendingSubmissions,
      completionPercentage: calculateCompletionPercentage(
        acknowledgedSubmissions,
        totalSubmissions,
      ),
    };
  });
};

const getAccessibleCourses = async (user) => {
  if (user.role === "PROFESSOR") {
    return getProfessorCourseSummaries(user.id);
  }

  return getStudentCourseSummaries(user.id);
};

const getCourseById = async ({ user, courseId }) => {
  if (user.role === "PROFESSOR") {
    await ensureProfessorOwnsCourse(user.id, courseId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: courseProfessorInclude,
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const assignments = course.assignments.map((assignment) => {
      const acknowledgedSubmissions = assignment.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length;
      const submittedSubmissions = assignment.submissions.filter(
        (submission) => submission.status === SubmissionStatus.SUBMITTED,
      ).length;

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.dueDate,
        dueDate: assignment.dueDate,
        submissionType: assignment.submissionType,
        totalSubmissions: assignment.submissions.length,
        pendingSubmissions: assignment.submissions.filter(
          (submission) => submission.status === SubmissionStatus.PENDING,
        ).length,
        submittedSubmissions,
        acknowledgedSubmissions,
        completionPercentage: calculateCompletionPercentage(
          acknowledgedSubmissions,
          assignment.submissions.length,
        ),
        assignedGroups: assignment.assignmentGroups.map((item) => ({
          id: item.group.id,
          name: item.group.name,
        })),
      };
    });

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      professor: course.professor,
      studentCount: course.enrollments.length,
      groupCount: course.groups.length,
      assignmentCount: assignments.length,
      completionPercentage: calculateCompletionPercentage(
        assignments.reduce(
          (count, assignment) => count + assignment.acknowledgedSubmissions,
          0,
        ),
        assignments.reduce(
          (count, assignment) => count + assignment.totalSubmissions,
          0,
        ),
      ),
      assignments,
      groups: course.groups.map((group) => ({
        id: group.id,
        name: group.name,
        leaderId: group.createdById,
        leader: group.createdBy,
        memberCount: group.members.length,
      })),
    };
  }

  await ensureStudentEnrolledInCourse(user.id, courseId);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: courseStudentInclude,
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const membership = await getGroupMembershipByCourse(user.id, courseId);
  const assignments = course.assignments
    .filter((assignment) => isStudentAssignmentVisible(assignment, membership))
    .map((assignment) => mapStudentAssignment(assignment, membership, user.id, course));
  const completedAssignments = assignments.filter((assignment) =>
    completedStatuses.includes(assignment.status),
  ).length;

  return {
    id: course.id,
    name: course.name,
    code: course.code,
    description: course.description,
    professor: course.professor,
    studentCount: course.enrollments.length,
    group: membership
      ? {
          id: membership.group.id,
          name: membership.group.name,
          leaderId: membership.group.createdById,
          leader: membership.group.createdBy,
          members: membership.group.members.map((member) => ({
            id: member.id,
            joinedAt: member.joinedAt,
            student: member.student,
          })),
        }
      : null,
    totalAssignments: assignments.length,
    completedAssignments,
    pendingAssignments: assignments.length - completedAssignments,
    completionPercentage: calculateCompletionPercentage(
      completedAssignments,
      assignments.length,
    ),
    progressStatus: getProgressLabel(completedAssignments, assignments.length),
    assignments,
  };
};

const getCourseAssignments = async ({ user, courseId }) => {
  const course = await getCourseById({ user, courseId });
  return course.assignments;
};

const createCourse = async ({ user, payload }) => {
  if (user.role !== "PROFESSOR") {
    throw new AppError("Only professors can create courses", 403);
  }

  const { name, code, description } = validateCoursePayload(payload);

  const existingCourse = await prisma.course.findUnique({
    where: { code },
  });

  if (existingCourse) {
    throw new AppError("Course code already exists", 400);
  }

  const course = await prisma.course.create({
    data: {
      name,
      code,
      description,
      professorId: user.id,
    },
    include: {
      professor: {
        select: safeUserSelect,
      },
    },
  });

  return course;
};

const updateCourse = async ({ user, courseId, payload }) => {
  if (user.role !== "PROFESSOR") {
    throw new AppError("Only professors can update courses", 403);
  }

  await ensureProfessorOwnsCourse(user.id, courseId);

  const { name, code, description } = validateCoursePayload(payload);

  const existingCourse = await prisma.course.findUnique({
    where: { code },
  });

  if (existingCourse && existingCourse.id !== courseId) {
    throw new AppError("Course code already exists", 400);
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      name,
      code,
      description,
    },
    include: {
      professor: {
        select: safeUserSelect,
      },
    },
  });

  return course;
};

const deleteCourse = async ({ user, courseId }) => {
  if (user.role !== "PROFESSOR") {
    throw new AppError("Only professors can delete courses", 403);
  }

  await ensureProfessorOwnsCourse(user.id, courseId);

  await prisma.course.delete({
    where: { id: courseId },
  });

  return { id: courseId };
};

module.exports = {
  getAccessibleCourses,
  getCourseById,
  getCourseAssignments,
  getStudentCourseSummaries,
  getProfessorCourseSummaries,
  createCourse,
  updateCourse,
  deleteCourse,
};
