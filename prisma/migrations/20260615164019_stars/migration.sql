/*
  Warnings:

  - You are about to drop the column `progress` on the `UserGameEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserGameEntry" DROP COLUMN "progress",
ADD COLUMN     "masteredAt" TIMESTAMP(3),
ADD COLUMN     "timePlayed" DOUBLE PRECISION;
