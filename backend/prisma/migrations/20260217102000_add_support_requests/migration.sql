-- CreateEnum
CREATE TYPE "ComplaintKind" AS ENUM ('REPORT', 'SUPPORT');

-- AlterEnum
ALTER TYPE "ComplaintTargetType" ADD VALUE 'NONE';

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN "kind" "ComplaintKind" NOT NULL DEFAULT 'REPORT';
