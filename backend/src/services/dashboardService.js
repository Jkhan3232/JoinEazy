const { Role, SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const {
  calculateCompletionPercentage,
  completedStatuses,
  getProgressLabel,
  getStudentGroupMemberships,
  safeUserSelect,
} = require("./sharedService");
const {
  getProfessorCourseSummaries,
  getStudentCourseSummaries,
} = require("./courseService");

const getSubmissionProgress = (status) => {
  if (completedStatuses.includes(status)) {
    return 100;
  }

  if (status === SubmissionStatus.SUBMITTED) {
    return 65;
  }

  return 0;
};

const getStudentAssignments = async (studentId) => {
  const [enrollments, memberships] = await Promise.all([
    prisma.studentCourse.findMany({
      where: { studentId },
      select: {
        courseId: true,
      },
    }),
    getStudentGroupMemberships(studentId),
  ]);

  const membershipByCourseId = new Map(
    memberships
      .filter((membership) => membership.group.courseId)
      .map((membership) => [membership.group.courseId, membership]),
  );
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  const groupIds = memberships.map((membership) => membership.groupId);

  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        {
          submissionType: "INDIVIDUAL",
          courseId: {
            in: courseIds.length ? courseIds : ["__no_course__"],
          },
        },
        {
          assignmentGroups: {
            some: {
              groupId: {
                in: groupIds.length ? groupIds : ["__no_group__"],
              },
            },
          },
        },
      ],
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignmentGroups: {
        select: {
          groupId: true,
        },
      },
      submissions: {
        where: {
          OR: [
            {
              studentId,
            },
            {
              groupId: {
                in: groupIds.length ? groupIds : ["__no_group__"],
              },
            },
          ],
        },
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const mappedAssignments = assignments.map((assignment) => {
    const membership = assignment.courseId
      ? membershipByCourseId.get(assignment.courseId) || null
      : memberships.find((item) =>
          assignment.assignmentGroups.some((group) => group.groupId === item.groupId),
        ) || null;
    const submission =
      assignment.submissionType === "INDIVIDUAL"
        ? assignment.submissions.find((item) => item.studentId === studentId) || null
        : assignment.submissions.find(
            (item) => item.groupId === membership?.groupId && item.studentId === null,
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
          }
        : null,
      group:
        assignment.submissionType === "GROUP" && membership
          ? {
              id: membership.group.id,
              name: membership.group.name,
              leaderId: membership.group.createdById,
              leader: membership.group.createdBy,
            }
          : null,
      isGroupLeader: Boolean(
        assignment.submissionType === "GROUP" && membership?.group.createdById === studentId,
      ),
      submissionStatus: status,
      status,
      progress: getSubmissionProgress(status),
      acknowledgedAt: submission?.confirmedAt || null,
      confirmedAt: submission?.confirmedAt || null,
      acknowledgedBy: submission?.confirmedBy || null,
      confirmedBy: submission?.confirmedBy || null,
    };
  });

  const completedAssignments = mappedAssignments.filter((assignment) =>
    completedStatuses.includes(assignment.status),
  ).length;

  return {
    groups: memberships.map((membership) => ({
      id: membership.group.id,
      name: membership.group.name,
      courseId: membership.group.courseId,
      course: membership.group.course,
      leaderId: membership.group.createdById,
      leader: membership.group.createdBy,
      members: membership.group.members.map((member) => ({
        id: member.id,
        joinedAt: member.joinedAt,
        student: member.student,
      })),
    })),
    totals: {
      totalAssignedAssignments: mappedAssignments.length,
      completedAssignments,
      pendingAssignments: mappedAssignments.length - completedAssignments,
      completionPercentage: calculateCompletionPercentage(
        completedAssignments,
        mappedAssignments.length,
      ),
    },
    assignments: mappedAssignments,
  };
};

const getStudentDashboard = async (studentId) => {
  const [user, courses, assignmentBundle] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: safeUserSelect,
    }),
    getStudentCourseSummaries(studentId),
    getStudentAssignments(studentId),
  ]);

  return {
    studentProfile: user,
    courseCount: courses.length,
    groupCount: assignmentBundle.groups.length,
    totalAssignedAssignments: assignmentBundle.totals.totalAssignedAssignments,
    completedAssignments: assignmentBundle.totals.completedAssignments,
    pendingAssignments: assignmentBundle.totals.pendingAssignments,
    completionPercentage: assignmentBundle.totals.completionPercentage,
    progressStatus: getProgressLabel(
      assignmentBundle.totals.completedAssignments,
      assignmentBundle.totals.totalAssignedAssignments,
    ),
    groups: assignmentBundle.groups,
    recentAssignments: assignmentBundle.assignments.slice(0, 4),
    assignments: assignmentBundle.assignments,
    courses,
  };
};

const getAdminDashboard = async (user) => {
  const courses = await getProfessorCourseSummaries(user.id);

  const [assignments, submissions, groups, students] = await Promise.all([
    prisma.assignment.findMany({
      where: {},
      include: {
        course: true,
        submissions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),
    prisma.submission.findMany({
      where: {},
    }),
    prisma.group.findMany({
      where: {},
    }),
    prisma.studentCourse.findMany({
      where: {},
      select: {
        studentId: true,
      },
      distinct: ["studentId"],
    }),
  ]);

  const totalSubmissions = submissions.length;
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === SubmissionStatus.PENDING,
  ).length;
  const submittedSubmissions = submissions.filter(
    (submission) => submission.status === SubmissionStatus.SUBMITTED,
  ).length;
  const acknowledgedSubmissions = submissions.filter((submission) =>
    completedStatuses.includes(submission.status),
  ).length;

  return {
    totalCourses: courses.length,
    totalStudents: students.length,
    totalGroups: groups.length,
    totalAssignments: assignments.length,
    totalSubmissions,
    pendingSubmissions,
    submittedSubmissions,
    confirmedSubmissions: acknowledgedSubmissions,
    acknowledgedSubmissions,
    completionPercentage: calculateCompletionPercentage(
      acknowledgedSubmissions,
      totalSubmissions,
    ),
    recentAssignments: assignments.map((assignment) => {
      const completedSubmissionCount = assignment.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length;

      return {
        id: assignment.id,
        title: assignment.title,
        deadline: assignment.dueDate,
        dueDate: assignment.dueDate,
        course: assignment.course
          ? {
              id: assignment.course.id,
              name: assignment.course.name,
              code: assignment.course.code,
            }
          : null,
        totalSubmissions: assignment.submissions.length,
        confirmedSubmissions: completedSubmissionCount,
        acknowledgedSubmissions: completedSubmissionCount,
        completionPercentage: calculateCompletionPercentage(
          completedSubmissionCount,
          assignment.submissions.length,
        ),
      };
    }),
    courses,
  };
};

const getAdminAnalytics = async (user) => {
  const courses = await getProfessorCourseSummaries(user.id);
  const courseIds = courses.map((course) => course.id);

  const [assignments, groups, students, submissions] = await Promise.all([
    prisma.assignment.findMany({
      where: {},
      include: {
        course: true,
        submissions: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.group.findMany({
      where: {},
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
        },
        submissions: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: Role.STUDENT,
      },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
        memberships: {
          include: {
            group: {
              include: {
                course: true,
              },
            },
          },
        },
        individualSubmissions: {
          where: {},
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.submission.findMany({
      where: {},
    }),
  ]);

  const acknowledgedSubmissions = submissions.filter((submission) =>
    completedStatuses.includes(submission.status),
  ).length;
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === SubmissionStatus.PENDING,
  ).length;
  const submittedSubmissions = submissions.filter(
    (submission) => submission.status === SubmissionStatus.SUBMITTED,
  ).length;

  return {
    overallSubmissionCompletion: {
      confirmedSubmissions: acknowledgedSubmissions,
      acknowledgedSubmissions,
      totalSubmissions: submissions.length,
      completionPercentage: calculateCompletionPercentage(
        acknowledgedSubmissions,
        submissions.length,
      ),
    },
    statusDistribution: [
      { name: "Pending", value: pendingSubmissions },
      { name: "Submitted", value: submittedSubmissions },
      { name: "Acknowledged", value: acknowledgedSubmissions },
    ],
    courseWiseCompletion: courses.map((course) => ({
      courseId: course.id,
      courseName: course.code,
      completionPercentage: course.completionPercentage,
      acknowledgedSubmissions: course.acknowledgedSubmissions,
      totalSubmissions: course.totalSubmissions,
    })),
    groupWiseCompletion: groups.map((group) => {
      const groupAcknowledgedSubmissions = group.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length;

      return {
        groupId: group.id,
        groupName: group.name,
        courseName: group.course?.code || "Legacy",
        confirmedSubmissions: groupAcknowledgedSubmissions,
        acknowledgedSubmissions: groupAcknowledgedSubmissions,
        totalSubmissions: group.submissions.length,
        completionPercentage: calculateCompletionPercentage(
          groupAcknowledgedSubmissions,
          group.submissions.length,
        ),
      };
    }),
    assignmentWiseCompletion: assignments.map((assignment) => {
      const assignmentAcknowledgedSubmissions = assignment.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length;

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        courseName: assignment.course?.code || "Legacy",
        confirmedSubmissions: assignmentAcknowledgedSubmissions,
        acknowledgedSubmissions: assignmentAcknowledgedSubmissions,
        totalSubmissions: assignment.submissions.length,
        completionPercentage: calculateCompletionPercentage(
          assignmentAcknowledgedSubmissions,
          assignment.submissions.length,
        ),
      };
    }),
    studentPerformance: students.map((student) => {
      const courseMemberships = student.memberships.filter((membership) =>
        courseIds.includes(membership.group.courseId),
      );
      const groupConfirmedAssignments = courseMemberships.reduce(
        (count, membership) =>
          count +
          (groups
            .find((group) => group.id === membership.groupId)
            ?.submissions?.filter((submission) =>
              completedStatuses.includes(submission.status),
            )?.length || 0),
        0,
      );
      const individuallyAcknowledgedAssignments = student.individualSubmissions.filter(
        (submission) => completedStatuses.includes(submission.status),
      ).length;

      return {
        studentId: student.id,
        name: student.name,
        email: student.email,
        courses: student.enrollments.map((enrollment) => ({
          id: enrollment.course.id,
          name: enrollment.course.name,
          code: enrollment.course.code,
        })),
        groups: courseMemberships.map((membership) => ({
          id: membership.group.id,
          name: membership.group.name,
          courseId: membership.group.courseId,
        })),
        confirmedByStudent: individuallyAcknowledgedAssignments,
        groupConfirmedAssignments,
      };
    }),
  };
};

const getAdminGroups = async (user) => {
  const groups = await prisma.group.findMany({
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
      },
      assignments: true,
      submissions: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return groups.map((group) => {
    const acknowledgedSubmissionCount = group.submissions.filter((submission) =>
      completedStatuses.includes(submission.status),
    ).length;

    return {
      id: group.id,
      name: group.name,
      course: null,
      leaderId: group.createdById,
      leader: group.createdBy,
      createdBy: group.createdBy,
      members: group.members.map((member) => member.student),
      assignmentCount: group.assignments.length,
      confirmedSubmissions: acknowledgedSubmissionCount,
      acknowledgedSubmissions: acknowledgedSubmissionCount,
      pendingSubmissions: group.submissions.length - acknowledgedSubmissionCount,
      completionPercentage: calculateCompletionPercentage(
        acknowledgedSubmissionCount,
        group.submissions.length,
      ),
      progressStatus: getProgressLabel(
        acknowledgedSubmissionCount,
        group.submissions.length,
      ),
      createdAt: group.createdAt,
    };
  });
};

const getAdminStudents = async (user) => {
  const students = await prisma.user.findMany({
    where: {
      role: Role.STUDENT,
    },
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
      memberships: {
        include: {
          group: {
            include: {
              course: true,
              submissions: true,
            },
          },
        },
      },
      individualSubmissions: {
        where: {},
        include: {
          assignment: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return students.map((student) => {
    const memberships = student.memberships;
    const groupSubmissions = memberships.flatMap(
      (membership) => membership.group.submissions,
    );
    const groupConfirmedAssignments = groupSubmissions.filter((submission) =>
      completedStatuses.includes(submission.status),
    ).length;
    const individuallyAcknowledgedAssignments = student.individualSubmissions.filter(
      (submission) => completedStatuses.includes(submission.status),
    ).length;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      courses: student.enrollments.map((enrollment) => ({
        id: enrollment.course.id,
        name: enrollment.course.name,
        code: enrollment.course.code,
      })),
      groups: memberships.map((membership) => ({
        id: membership.group.id,
        name: membership.group.name,
        courseId: membership.group.courseId,
        courseCode: membership.group.course?.code || null,
      })),
      totalGroupAssignments: groupSubmissions.length,
      groupConfirmedAssignments,
      personallyConfirmedAssignments: individuallyAcknowledgedAssignments,
      latestConfirmedSubmission:
        student.individualSubmissions
          .slice()
          .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))[0] ||
        null,
    };
  });
};

module.exports = {
  getStudentAssignments,
  getStudentDashboard,
  getStudentCourseSummaries,
  getAdminDashboard,
  getAdminAnalytics,
  getAdminGroups,
  getAdminStudents,
};
