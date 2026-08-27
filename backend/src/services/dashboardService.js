const { Role, SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const {
  calculateCompletionPercentage,
  getCurrentGroupMembership,
  getProgressLabel,
  safeUserSelect,
} = require("./sharedService");

const completedStatuses = [
  SubmissionStatus.CONFIRMED,
  SubmissionStatus.ACKNOWLEDGED,
];

const mapStudentAssignment = (assignment, group, studentId) => {
  const submission =
    assignment.submissions.find((item) =>
      assignment.submissionType === "INDIVIDUAL"
        ? item.studentId === studentId
        : item.groupId === group?.id,
    ) || null;

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    oneDriveLink: assignment.oneDriveLink,
    submissionType: assignment.submissionType,
    isGroupLeader: Boolean(group && group.createdById === studentId),
    group: group ? { id: group.id, name: group.name } : null,
    submissionStatus: submission?.status || SubmissionStatus.PENDING,
    confirmedAt: submission?.confirmedAt || null,
    confirmedBy: submission?.confirmedBy || null,
  };
};

const getStudentAssignments = async (studentId) => {
  const membership = await getCurrentGroupMembership(studentId);
  const enrollments = await prisma.studentCourse.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);

  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        ...(membership
          ? [{ assignmentGroups: { some: { groupId: membership.groupId } } }]
          : []),
        ...(courseIds.length
          ? [{ submissionType: "INDIVIDUAL", courseId: { in: courseIds } }]
          : []),
      ],
    },
    include: {
      course: true,
      submissions: {
        include: {
          confirmedBy: {
            select: safeUserSelect,
          },
        },
        where: membership
          ? { OR: [{ groupId: membership.groupId }, { studentId }] }
          : { studentId },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const mappedAssignments = assignments.map((assignment) =>
    mapStudentAssignment(assignment, membership?.group || null, studentId),
  );
  const completedAssignments = mappedAssignments.filter((assignment) =>
    [SubmissionStatus.CONFIRMED, "ACKNOWLEDGED"].includes(
      assignment.submissionStatus,
    ),
  ).length;
  const totalAssignedAssignments = mappedAssignments.length;

  return {
    group: membership
      ? {
          id: membership.group.id,
          name: membership.group.name,
          createdBy: membership.group.createdBy,
          members: membership.group.members.map((member) => ({
            id: member.id,
            joinedAt: member.joinedAt,
            student: member.student,
          })),
        }
      : null,
    totals: {
      totalAssignedAssignments,
      completedAssignments,
      pendingAssignments: totalAssignedAssignments - completedAssignments,
      completionPercentage: calculateCompletionPercentage(
        completedAssignments,
        totalAssignedAssignments,
      ),
    },
    assignments: mappedAssignments,
  };
};

const getStudentCourses = async (studentId) => {
  const membership = await getCurrentGroupMembership(studentId);
  const courses = await prisma.course.findMany({
    where: { enrollments: { some: { studentId } } },
    include: {
      professor: { select: safeUserSelect },
      assignments: {
        include: {
          submissions: true,
        },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return courses.map((course) => {
    const completed = course.assignments.filter((assignment) =>
      assignment.submissions.some(
        (submission) =>
          submission.status &&
          completedStatuses.includes(submission.status) &&
          (assignment.submissionType === "INDIVIDUAL"
            ? submission.studentId === studentId
            : submission.groupId === membership?.groupId),
      ),
    ).length;
    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      professor: course.professor,
      assignmentCount: course.assignments.length,
      completedAssignments: completed,
      pendingAssignments: course.assignments.length - completed,
      completionPercentage: calculateCompletionPercentage(
        completed,
        course.assignments.length,
      ),
    };
  });
};

const getStudentDashboard = async (studentId) => {
  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: safeUserSelect,
  });
  const assignmentBundle = await getStudentAssignments(studentId);
  const completedAssignments = assignmentBundle.totals.completedAssignments;
  const totalAssignedAssignments = assignmentBundle.totals.totalAssignedAssignments;

  return {
    studentProfile: user,
    currentGroup: assignmentBundle.group,
    groupMembers: assignmentBundle.group?.members || [],
    totalAssignedAssignments,
    completedAssignments,
    pendingAssignments: assignmentBundle.totals.pendingAssignments,
    completionPercentage: assignmentBundle.totals.completionPercentage,
    progressStatus: getProgressLabel(completedAssignments, totalAssignedAssignments),
    recentAssignments: assignmentBundle.assignments.slice(0, 4),
    assignments: assignmentBundle.assignments,
  };
};

const getAdminDashboard = async () => {
  const [
    totalStudents,
    totalGroups,
    totalAssignments,
    totalSubmissions,
    confirmedSubmissions,
    pendingSubmissions,
    submittedSubmissions,
    acknowledgedSubmissions,
    recentAssignments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.group.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.submission.count({
      where: {
        status: {
          in: [SubmissionStatus.CONFIRMED, SubmissionStatus.ACKNOWLEDGED],
        },
      },
    }),
    prisma.submission.count({ where: { status: SubmissionStatus.PENDING } }),
    prisma.submission.count({ where: { status: SubmissionStatus.SUBMITTED } }),
    prisma.submission.count({
      where: {
        status: {
          in: [SubmissionStatus.ACKNOWLEDGED, SubmissionStatus.CONFIRMED],
        },
      },
    }),
    prisma.assignment.findMany({
      include: {
        assignmentGroups: true,
        submissions: true,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    totalStudents,
    totalGroups,
    totalAssignments,
    totalSubmissions,
    confirmedSubmissions,
    pendingSubmissions,
    submittedSubmissions,
    acknowledgedSubmissions,
    completionPercentage: calculateCompletionPercentage(
      confirmedSubmissions,
      totalSubmissions,
    ),
    recentAssignments: recentAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      assignedGroups: assignment.assignmentGroups.length,
      confirmedSubmissions: assignment.submissions.filter((submission) =>
        [SubmissionStatus.CONFIRMED, SubmissionStatus.ACKNOWLEDGED].includes(
          submission.status,
        ),
      ).length,
      totalSubmissions: assignment.submissions.length,
    })),
  };
};

const getAdminAnalytics = async () => {
  const [groups, assignments, students] = await Promise.all([
    prisma.group.findMany({
      include: {
        submissions: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.assignment.findMany({
      include: {
        submissions: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: Role.STUDENT,
      },
      include: {
        memberships: {
          include: {
            group: true,
          },
        },
        submissions: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const totalSubmissionSlots = assignments.reduce(
    (count, assignment) => count + assignment.submissions.length,
    0,
  );
  const confirmedSubmissionCount = assignments.reduce(
    (count, assignment) =>
      count +
      assignment.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length,
    0,
  );

  return {
    overallSubmissionCompletion: {
      confirmedSubmissions: confirmedSubmissionCount,
      totalSubmissions: totalSubmissionSlots,
      completionPercentage: calculateCompletionPercentage(
        confirmedSubmissionCount,
        totalSubmissionSlots,
      ),
    },
    groupWiseCompletion: groups.map((group) => {
      const confirmedCount = group.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length;
      const totalCount = group.submissions.length;

      return {
        groupId: group.id,
        groupName: group.name,
        confirmedSubmissions: confirmedCount,
        totalSubmissions: totalCount,
        completionPercentage: calculateCompletionPercentage(confirmedCount, totalCount),
      };
    }),
    assignmentWiseCompletion: assignments.map((assignment) => {
      const confirmedCount = assignment.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length;
      const totalCount = assignment.submissions.length;

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        confirmedSubmissions: confirmedCount,
        totalSubmissions: totalCount,
        completionPercentage: calculateCompletionPercentage(confirmedCount, totalCount),
      };
    }),
    studentPerformance: students.map((student) => {
      const currentMembership = student.memberships[0] || null;
      const totalAssignedToGroup = currentMembership
        ? groups.find((group) => group.id === currentMembership.groupId)?.submissions.length || 0
        : 0;

      return {
        studentId: student.id,
        name: student.name,
        email: student.email,
        group: currentMembership
          ? {
              id: currentMembership.group.id,
              name: currentMembership.group.name,
            }
          : null,
        confirmedByStudent: student.submissions.filter((submission) =>
          completedStatuses.includes(submission.status),
        ).length,
        totalAssignedToGroup,
      };
    }),
  };
};

const getAdminGroups = async () => {
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
    const confirmedSubmissions = group.submissions.filter((submission) =>
      completedStatuses.includes(submission.status),
    ).length;

    return {
      id: group.id,
      name: group.name,
      createdBy: group.createdBy,
      members: group.members.map((member) => member.student),
      assignmentCount: group.assignments.length,
      confirmedSubmissions,
      pendingSubmissions: group.submissions.length - confirmedSubmissions,
      completionPercentage: calculateCompletionPercentage(
        confirmedSubmissions,
        group.submissions.length,
      ),
      progressStatus: getProgressLabel(confirmedSubmissions, group.submissions.length),
      createdAt: group.createdAt,
    };
  });
};

const getAdminStudents = async () => {
  const students = await prisma.user.findMany({
    where: {
      role: Role.STUDENT,
    },
    include: {
      memberships: {
        include: {
          group: {
            include: {
              submissions: true,
            },
          },
        },
      },
      submissions: {
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
    const membership = student.memberships[0] || null;
    const groupSubmissions = membership?.group.submissions || [];
    const confirmedGroupSubmissions = groupSubmissions.filter((submission) =>
      completedStatuses.includes(submission.status),
    ).length;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      group: membership
        ? {
            id: membership.group.id,
            name: membership.group.name,
          }
        : null,
      totalGroupAssignments: groupSubmissions.length,
      groupConfirmedAssignments: confirmedGroupSubmissions,
      personallyConfirmedAssignments: student.submissions.filter((submission) =>
        completedStatuses.includes(submission.status),
      ).length,
      latestConfirmedSubmission:
        student.submissions
          .slice()
          .sort(
            (left, right) =>
              new Date(right.updatedAt) - new Date(left.updatedAt),
          )[0] || null,
    };
  });
};

module.exports = {
  getStudentAssignments,
  getStudentCourses,
  getStudentDashboard,
  getAdminDashboard,
  getAdminAnalytics,
  getAdminGroups,
  getAdminStudents,
};
