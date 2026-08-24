const { Role, SubmissionStatus } = require("@prisma/client");

const prisma = require("../config/prisma");
const {
  calculateCompletionPercentage,
  getCurrentGroupMembership,
  getProgressLabel,
  safeUserSelect,
} = require("./sharedService");

const mapStudentAssignment = (assignment, group) => {
  const submission = assignment.submissions[0] || null;

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    oneDriveLink: assignment.oneDriveLink,
    group: {
      id: group.id,
      name: group.name,
    },
    submissionStatus: submission?.status || SubmissionStatus.PENDING,
    confirmedAt: submission?.confirmedAt || null,
    confirmedBy: submission?.confirmedBy || null,
  };
};

const getStudentAssignments = async (studentId) => {
  const membership = await getCurrentGroupMembership(studentId);

  if (!membership) {
    return {
      group: null,
      totals: {
        totalAssignedAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        completionPercentage: 0,
      },
      assignments: [],
    };
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      assignmentGroups: {
        some: {
          groupId: membership.groupId,
        },
      },
    },
    include: {
      submissions: {
        where: {
          groupId: membership.groupId,
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

  const mappedAssignments = assignments.map((assignment) =>
    mapStudentAssignment(assignment, membership.group),
  );
  const completedAssignments = mappedAssignments.filter(
    (assignment) => assignment.submissionStatus === SubmissionStatus.CONFIRMED,
  ).length;
  const totalAssignedAssignments = mappedAssignments.length;

  return {
    group: {
      id: membership.group.id,
      name: membership.group.name,
      createdBy: membership.group.createdBy,
      members: membership.group.members.map((member) => ({
        id: member.id,
        joinedAt: member.joinedAt,
        student: member.student,
      })),
    },
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
    recentAssignments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.group.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: SubmissionStatus.CONFIRMED } }),
    prisma.submission.count({ where: { status: SubmissionStatus.PENDING } }),
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
    completionPercentage: calculateCompletionPercentage(
      confirmedSubmissions,
      totalSubmissions,
    ),
    recentAssignments: recentAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      assignedGroups: assignment.assignmentGroups.length,
      confirmedSubmissions: assignment.submissions.filter(
        (submission) => submission.status === SubmissionStatus.CONFIRMED,
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
        submissions: {
          where: {
            status: SubmissionStatus.CONFIRMED,
          },
        },
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
      assignment.submissions.filter((submission) => submission.status === SubmissionStatus.CONFIRMED)
        .length,
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
      const confirmedCount = group.submissions.filter(
        (submission) => submission.status === SubmissionStatus.CONFIRMED,
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
      const confirmedCount = assignment.submissions.filter(
        (submission) => submission.status === SubmissionStatus.CONFIRMED,
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
        confirmedByStudent: student.submissions.length,
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
    const confirmedSubmissions = group.submissions.filter(
      (submission) => submission.status === SubmissionStatus.CONFIRMED,
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
    const confirmedGroupSubmissions = groupSubmissions.filter(
      (submission) => submission.status === SubmissionStatus.CONFIRMED,
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
      personallyConfirmedAssignments: student.submissions.length,
      latestConfirmedSubmission: student.submissions
        .slice()
        .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))[0] || null,
    };
  });
};

module.exports = {
  getStudentAssignments,
  getStudentDashboard,
  getAdminDashboard,
  getAdminAnalytics,
  getAdminGroups,
  getAdminStudents,
};
