-- Extend the existing status enum without changing legacy CONFIRMED rows.
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';

ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED';

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCourse" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentCourse_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "courseId" TEXT;

ALTER TABLE "Submission" ADD COLUMN "studentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course" ("code");

CREATE INDEX "Course_professorId_idx" ON "Course" ("professorId");

CREATE INDEX "StudentCourse_studentId_idx" ON "StudentCourse" ("studentId");

CREATE INDEX "StudentCourse_courseId_idx" ON "StudentCourse" ("courseId");

CREATE UNIQUE INDEX "StudentCourse_studentId_courseId_key" ON "StudentCourse" ("studentId", "courseId");

CREATE INDEX "Assignment_courseId_idx" ON "Assignment" ("courseId");

CREATE INDEX "Submission_studentId_idx" ON "Submission" ("studentId");

CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "Submission" ("assignmentId", "studentId");

-- AddForeignKey
ALTER TABLE "Course"
ADD CONSTRAINT "Course_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentCourse"
ADD CONSTRAINT "StudentCourse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentCourse"
ADD CONSTRAINT "StudentCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assignment"
ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Submission"
ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;