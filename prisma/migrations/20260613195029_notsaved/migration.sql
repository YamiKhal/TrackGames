/*
  Warnings:

  - You are about to drop the column `developer` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `publisher` on the `Game` table. All the data in the column will be lost.
  - The `platforms` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `genres` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `franchises` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `collections` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `similarGames` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "developer",
DROP COLUMN "publisher",
ADD COLUMN     "developers" INTEGER[],
ADD COLUMN     "publishers" INTEGER[],
DROP COLUMN "platforms",
ADD COLUMN     "platforms" INTEGER[],
DROP COLUMN "genres",
ADD COLUMN     "genres" INTEGER[],
DROP COLUMN "franchises",
ADD COLUMN     "franchises" INTEGER[],
DROP COLUMN "collections",
ADD COLUMN     "collections" INTEGER[],
DROP COLUMN "similarGames",
ADD COLUMN     "similarGames" INTEGER[];
