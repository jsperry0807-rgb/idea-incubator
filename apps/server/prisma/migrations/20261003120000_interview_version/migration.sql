-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- Backfill is unnecessary: existing rows start at 0, which is the version the
-- next writer expects to read. Every write increments, so no two writes can
-- present the same version going forward.