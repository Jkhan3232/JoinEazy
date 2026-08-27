-- Group submissions are identified by assignment and group with a NULL studentId.
-- Individual submissions are identified by assignment, group, and student.
DROP INDEX IF EXISTS "Submission_assignmentId_groupId_key";

DROP INDEX IF EXISTS "Submission_assignmentId_studentId_key";

CREATE UNIQUE INDEX "Submission_group_assignment_unique" ON "Submission" ("assignmentId", "groupId")
WHERE
    "studentId" IS NULL;

CREATE UNIQUE INDEX "Submission_student_assignment_unique" ON "Submission" ("assignmentId", "studentId")
WHERE
    "studentId" IS NOT NULL;