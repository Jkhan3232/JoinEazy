const bcrypt = require("bcryptjs");
const {
  PrismaClient,
  Role,
  SubmissionStatus,
  AssignmentType,
} = require("@prisma/client");

const prisma = new PrismaClient();

const createGroupAssignmentSubmissions = async ({
  assignmentId,
  groupTargets,
  statusByGroupId,
}) => {
  for (const group of groupTargets) {
    const status = statusByGroupId[group.id] || SubmissionStatus.PENDING;
    const confirmedAt = status === SubmissionStatus.PENDING ? null : new Date();
    const confirmedById =
      status === SubmissionStatus.ACKNOWLEDGED
        ? group.createdById
        : status === SubmissionStatus.CONFIRMED
          ? group.professorId
          : null;

    await prisma.submission.create({
      data: {
        assignmentId,
        groupId: group.id,
        studentId: null,
        status,
        ...(confirmedById
          ? {
              confirmedById,
              confirmedAt,
            }
          : {}),
      },
    });
  }
};

const createIndividualAssignmentSubmissions = async ({
  assignmentId,
  studentIds,
  statusByStudentId,
  professorId,
}) => {
  for (const studentId of studentIds) {
    const status = statusByStudentId[studentId] || SubmissionStatus.PENDING;
    const hasConfirmation = [
      SubmissionStatus.ACKNOWLEDGED,
      SubmissionStatus.CONFIRMED,
    ].includes(status);
    const confirmedAt = hasConfirmation ? new Date() : null;
    const confirmedById =
      status === SubmissionStatus.CONFIRMED
        ? professorId
        : status === SubmissionStatus.ACKNOWLEDGED
          ? studentId
          : null;

    await prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        groupId: null,
        status,
        ...(confirmedById
          ? {
              confirmedById,
              confirmedAt,
            }
          : {}),
      },
    });
  }
};

async function main() {
  await prisma.submission.deleteMany();
  await prisma.assignmentGroup.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.studentCourse.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.group.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const hashedProfessorPassword = await bcrypt.hash("Professor@123", 10);
  const hashedStudentPassword = await bcrypt.hash("Student@123", 10);

  const professor = await prisma.user.create({
    data: {
      name: "Joineazy Professor",
      email: "professor@joineazy.test",
      password: hashedProfessorPassword,
      role: Role.PROFESSOR,
    },
  });

  const students = await Promise.all(
    [
      "student1@joineazy.test",
      "student2@joineazy.test",
      "student3@joineazy.test",
      "student4@joineazy.test",
      "student5@joineazy.test",
    ].map((email, index) =>
      prisma.user.create({
        data: {
          name: `Student ${index + 1}`,
          email,
          password: hashedStudentPassword,
          role: Role.STUDENT,
        },
      }),
    ),
  );

  const frontendCourse = await prisma.course.create({
    data: {
      name: "Frontend Engineering",
      code: "FE-101",
      description:
        "Build responsive React interfaces with reusable components and clean state flows.",
      professorId: professor.id,
    },
  });

  const databaseCourse = await prisma.course.create({
    data: {
      name: "Database Systems",
      code: "DB-201",
      description:
        "Design reliable schemas, relationships, and submission tracking queries.",
      professorId: professor.id,
    },
  });

  await prisma.studentCourse.createMany({
    data: students.flatMap((student) => [
      { studentId: student.id, courseId: frontendCourse.id },
      { studentId: student.id, courseId: databaseCourse.id },
    ]),
  });

  const orbitBuilders = await prisma.group.create({
    data: {
      name: "Orbit Builders",
      courseId: frontendCourse.id,
      createdById: students[0].id,
      members: {
        create: [
          { studentId: students[0].id },
          { studentId: students[1].id },
          { studentId: students[4].id },
        ],
      },
    },
    include: {
      members: true,
    },
  });

  const novaReviewers = await prisma.group.create({
    data: {
      name: "Nova Reviewers",
      courseId: frontendCourse.id,
      createdById: students[2].id,
      members: {
        create: [
          { studentId: students[2].id },
          { studentId: students[3].id },
        ],
      },
    },
    include: {
      members: true,
    },
  });

  const queryCrafters = await prisma.group.create({
    data: {
      name: "Query Crafters",
      courseId: databaseCourse.id,
      createdById: students[3].id,
      members: {
        create: [
          { studentId: students[3].id },
          { studentId: students[4].id },
        ],
      },
    },
    include: {
      members: true,
    },
  });

  const groupAssignments = [
    {
      title: "Sprint 1 Design Review",
      description:
        "Prepare the final UI mock and supporting implementation notes for the frontend review.",
      dueDate: new Date("2026-08-31T17:00:00.000Z"),
      oneDriveLink: "https://onedrive.live.com/example-frontend-review",
      courseId: frontendCourse.id,
      targets: [orbitBuilders, novaReviewers],
      statuses: {
        [orbitBuilders.id]: SubmissionStatus.ACKNOWLEDGED,
        [novaReviewers.id]: SubmissionStatus.SUBMITTED,
      },
    },
    {
      title: "Schema Walkthrough",
      description:
        "Upload the schema notes and relationship diagram for the database systems module.",
      dueDate: new Date("2026-09-03T17:00:00.000Z"),
      oneDriveLink: "https://onedrive.live.com/example-schema-walkthrough",
      courseId: databaseCourse.id,
      targets: [queryCrafters],
      statuses: {
        [queryCrafters.id]: SubmissionStatus.CONFIRMED,
      },
    },
  ];

  for (const assignmentConfig of groupAssignments) {
    const assignment = await prisma.assignment.create({
      data: {
        title: assignmentConfig.title,
        description: assignmentConfig.description,
        dueDate: assignmentConfig.dueDate,
        oneDriveLink: assignmentConfig.oneDriveLink,
        submissionType: AssignmentType.GROUP,
        courseId: assignmentConfig.courseId,
        createdById: professor.id,
      },
    });

    await prisma.assignmentGroup.createMany({
      data: assignmentConfig.targets.map((group) => ({
        assignmentId: assignment.id,
        groupId: group.id,
      })),
      skipDuplicates: true,
    });

    await createGroupAssignmentSubmissions({
      assignmentId: assignment.id,
      groupTargets: assignmentConfig.targets.map((group) => ({
        ...group,
        professorId: professor.id,
      })),
      statusByGroupId: assignmentConfig.statuses,
    });
  }

  const individualAssignment = await prisma.assignment.create({
    data: {
      title: "Query Practice Pack",
      description:
        "Solve the SQL exercises individually and confirm once you have uploaded the files.",
      dueDate: new Date("2026-09-05T17:00:00.000Z"),
      oneDriveLink: "https://onedrive.live.com/example-query-practice",
      submissionType: AssignmentType.INDIVIDUAL,
      courseId: databaseCourse.id,
      createdById: professor.id,
    },
  });

  await createIndividualAssignmentSubmissions({
    assignmentId: individualAssignment.id,
    studentIds: students.map((student) => student.id),
    statusByStudentId: {
      [students[0].id]: SubmissionStatus.SUBMITTED,
      [students[1].id]: SubmissionStatus.ACKNOWLEDGED,
      [students[2].id]: SubmissionStatus.PENDING,
      [students[3].id]: SubmissionStatus.CONFIRMED,
      [students[4].id]: SubmissionStatus.SUBMITTED,
    },
    professorId: professor.id,
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
