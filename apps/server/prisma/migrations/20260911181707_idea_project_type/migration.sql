-- CreateEnum
CREATE TYPE "IdeaProjectType" AS ENUM ('SOFTWARE', 'GAME', 'WEBSITE');

-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "projectType" "IdeaProjectType" NOT NULL DEFAULT 'SOFTWARE';
