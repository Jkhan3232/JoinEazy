-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('INDIVIDUAL', 'GROUP');

-- AlterTable
ALTER TABLE "Assignment"
ADD COLUMN "submissionType" "AssignmentType" NOT NULL DEFAULT 'GROUP';