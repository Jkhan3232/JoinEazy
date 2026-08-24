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

  await prisma.submission.createMany({
    data: groupIds.map((groupId) => ({
      assignmentId: assignment.id,
      groupId,
      status: SubmissionStatus.PENDING,
    })),
    skipDuplicates: true,
  });
};

async function main() {
  await prisma.submission.deleteMany();
  await prisma.assignmentGroup.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.assignment.deleteMany();
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

  const assignment = await prisma.assignment.create({
    data: {
      title: "Week 1 Data Structures",
      description: "Upload your group solution deck and implementation notes to OneDrive.",
      dueDate: new Date("2026-08-31T17:00:00.000Z"),
      oneDriveLink: "https://onedrive.live.com/example-submission-folder",
      createdById: admin.id,
    },
  });

  await createAssignmentBundle({
    assignment,
    groupIds: [sampleGroup.id, reviewGroup.id],
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
