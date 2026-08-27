const bcrypt = require("bcryptjs");
const { PrismaClient, Role, SubmissionStatus } = require("@prisma/client");

const prisma = new PrismaClient();

const createAssignmentBundle = async ({ assignment, groupIds }) => {
  if (!groupIds.length) {
    return;
  }

  await prisma.assignmentGroup.createMany({
    data: groupIds.map((groupId) => ({
      assignmentId: assignment.id,
      groupId,
    })),
    skipDuplicates: true,
  });

  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    include: { members: true },
  });
  const submissions =
    assignment.submissionType === "INDIVIDUAL"
      ? groups.flatMap((group) =>
          group.members.map((member) => ({
            assignmentId: assignment.id,
            groupId: group.id,
            studentId: member.studentId,
            status: SubmissionStatus.PENDING,
          })),
        )
      : groupIds.map((groupId) => ({
          assignmentId: assignment.id,
          groupId,
          status: SubmissionStatus.PENDING,
        }));

  await prisma.submission.createMany({
    data: submissions,
    skipDuplicates: true,
  });
};

async function main() {
  await prisma.submission.deleteMany();
  await prisma.assignmentGroup.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.studentCourse.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const hashedAdminPassword = await bcrypt.hash("Admin@123", 10);
  const hashedStudentPassword = await bcrypt.hash("Student@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Joineazy Admin",
      email: "admin@joineazy.test",
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });

  const students = await Promise.all(
    [
      "student1@joineazy.test",
      "student2@joineazy.test",
      "student3@joineazy.test",
      "student4@joineazy.test",
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

  const sampleGroup = await prisma.group.create({
    data: {
      name: "Orbit Builders",
      createdById: students[1].id,
      members: {
        create: [
          { studentId: students[1].id },
          { studentId: students[2].id },
        ],
      },
    },
  });

  const reviewGroup = await prisma.group.create({
    data: {
      name: "Nova Reviewers",
      createdById: students[3].id,
      members: {
        create: [{ studentId: students[3].id }],
      },
    },
  });

  const webCourse = await prisma.course.create({
    data: {
      name: "MERN Stack Development",
      code: "MERN-101",
      description:
        "Build production-ready full-stack applications with MongoDB, Express, React, and Node.js.",
      professorId: admin.id,
    },
  });
  const databaseCourse = await prisma.course.create({
    data: {
      name: "Database Systems",
      code: "DB-201",
      description:
        "Design reliable relational data models, constraints, and queries.",
      professorId: admin.id,
    },
  });

  await prisma.studentCourse.createMany({
    data: students.flatMap((student, index) => [
      { studentId: student.id, courseId: webCourse.id },
      ...(index < 2
        ? [{ studentId: student.id, courseId: databaseCourse.id }]
        : []),
    ]),
  });

  const assignment = await prisma.assignment.create({
    data: {
      title: "Week 1 Data Structures",
      description:
        "Upload your group solution deck and implementation notes to OneDrive.",
      dueDate: new Date("2026-08-31T17:00:00.000Z"),
      oneDriveLink: "https://onedrive.live.com/example-submission-folder",
      submissionType: "GROUP",
      courseId: webCourse.id,
      createdById: admin.id,
    },
  });

  await createAssignmentBundle({
    assignment,
    groupIds: [sampleGroup.id, reviewGroup.id],
  });

  await prisma.submission.update({
    where: {
      assignmentId_groupId: {
        assignmentId: assignment.id,
        groupId: sampleGroup.id,
      },
    },
    data: {
      status: SubmissionStatus.CONFIRMED,
      confirmedById: students[1].id,
      confirmedAt: new Date(),
    },
  });

  const individualAssignment = await prisma.assignment.create({
    data: {
      title: "SQL Query Practice",
      description: "Submit your individual query solutions and notes.",
      dueDate: new Date("2026-09-03T17:00:00.000Z"),
      oneDriveLink: "https://onedrive.live.com/example-individual-folder",
      submissionType: "INDIVIDUAL",
      courseId: databaseCourse.id,
      createdById: admin.id,
    },
  });
  await createAssignmentBundle({
    assignment: individualAssignment,
    groupIds: [sampleGroup].map((group) => group.id),
  });

  await prisma.submission.update({
    where: {
      assignmentId_studentId: {
        assignmentId: individualAssignment.id,
        studentId: students[1].id,
      },
    },
    data: { status: SubmissionStatus.SUBMITTED },
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
