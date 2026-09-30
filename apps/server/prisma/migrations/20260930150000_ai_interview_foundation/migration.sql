-- Add enum values to IdeaProjectType. Postgres does not allow ADD VALUE inside
-- a transaction block used by multiple statements, so each ALTER TYPE runs as
-- its own statement.
ALTER TYPE "IdeaProjectType" ADD VALUE 'SAAS';

ALTER TYPE "IdeaProjectType" ADD VALUE 'PHYSICAL';

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'CLASSIFY',
    "state" JSONB NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interviews_ideaId_idx" ON "interviews"("ideaId");

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;