/*
  Warnings:

  - You are about to drop the column `postStatus` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "postStatus",
ADD COLUMN     "status" "postStatus" NOT NULL DEFAULT 'draft';
