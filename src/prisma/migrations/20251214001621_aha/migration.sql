-- CreateEnum
CREATE TYPE "postStatus" AS ENUM ('draft', 'published');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "postStatus" "postStatus" NOT NULL DEFAULT 'draft';
