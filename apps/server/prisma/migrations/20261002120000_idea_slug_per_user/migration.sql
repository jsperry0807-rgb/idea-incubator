-- Slug uniqueness becomes per-user.
--
-- The slug is a display identifier and is never used to resolve an idea, but it
-- carried a global @unique while the collision probe in idea.service.ts was
-- scoped to the owning user. Two users creating ideas with the same title both
-- resolved to the same slug and the second insert failed with P2002, surfacing
-- as a 500.
--
-- Dropping the global index is safe for existing data: any rows that survive are
-- still unique per user, because they were already unique globally.

-- DropIndex
DROP INDEX "ideas_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "ideas_userId_slug_key" ON "ideas"("userId", "slug");