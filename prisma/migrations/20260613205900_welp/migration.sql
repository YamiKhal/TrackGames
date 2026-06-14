/*
  Warnings:

  - The `startDate` column on the `Company` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "startDate",
ADD COLUMN     "startDate" TIMESTAMP(3);
