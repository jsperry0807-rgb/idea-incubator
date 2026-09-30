-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'TODO';

-- Backfill from the legacy boolean so existing tasks keep their meaning:
-- anything already ticked off belongs in the DONE column.
UPDATE "tasks" SET "status" = 'DONE' WHERE "completed" = true;

-- CreateIndex
CREATE INDEX "tasks_ideaId_status_sortOrder_idx" ON "tasks"("ideaId", "status", "sortOrder");
