/*
  Warnings:

  - You are about to drop the column `address` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "address",
ADD COLUMN     "website" TEXT;
