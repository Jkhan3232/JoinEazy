DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'ADMIN'
  ) THEN
    ALTER TYPE "Role" RENAME VALUE 'ADMIN' TO 'PROFESSOR';
  END IF;
END $$;

ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssignmentType') THEN
    CREATE TYPE "AssignmentType" AS ENUM ('INDIVIDUAL', 'GROUP');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "professorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Course_code_key" ON "Course"("code");
CREATE INDEX IF NOT EXISTS "Course_professorId_idx" ON "Course"("professorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Course_professorId_fkey'
  ) THEN
    ALTER TABLE "Course"
      ADD CONSTRAINT "Course_professorId_fkey"
      FOREIGN KEY ("professorId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "StudentCourse" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentCourse_studentId_courseId_key"
  ON "StudentCourse"("studentId", "courseId");
CREATE INDEX IF NOT EXISTS "StudentCourse_studentId_idx" ON "StudentCourse"("studentId");
CREATE INDEX IF NOT EXISTS "StudentCourse_courseId_idx" ON "StudentCourse"("courseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StudentCourse_studentId_fkey'
  ) THEN
    ALTER TABLE "StudentCourse"
      ADD CONSTRAINT "StudentCourse_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StudentCourse_courseId_fkey'
  ) THEN
    ALTER TABLE "StudentCourse"
      ADD CONSTRAINT "StudentCourse_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Group"
  ADD COLUMN IF NOT EXISTS "courseId" TEXT;

CREATE INDEX IF NOT EXISTS "Group_courseId_idx" ON "Group"("courseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Group_courseId_fkey'
  ) THEN
    ALTER TABLE "Group"
      ADD CONSTRAINT "Group_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "submissionType" "AssignmentType" NOT NULL DEFAULT 'GROUP',
  ADD COLUMN IF NOT EXISTS "courseId" TEXT;

UPDATE "Assignment"
SET "submissionType" = 'GROUP'
WHERE "submissionType" IS NULL;

CREATE INDEX IF NOT EXISTS "Assignment_courseId_idx" ON "Assignment"("courseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Assignment_courseId_fkey'
  ) THEN
    ALTER TABLE "Assignment"
      ADD CONSTRAINT "Assignment_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Submission"
  ADD COLUMN IF NOT EXISTS "studentId" TEXT,
  ALTER COLUMN "groupId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Submission_studentId_idx" ON "Submission"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Submission_assignmentId_studentId_key"
  ON "Submission"("assignmentId", "studentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Submission_studentId_fkey'
  ) THEN
    ALTER TABLE "Submission"
      ADD CONSTRAINT "Submission_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "Submission_assignmentId_groupId_studentId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Submission_assignmentId_groupId_key"
  ON "Submission"("assignmentId", "groupId");
