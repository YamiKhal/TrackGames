-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('MAINGAME', 'DLC', 'EXPANSION', 'BUNDLE', 'STANDALONE_EXPANSION', 'MOD', 'EPISODE', 'SEASON', 'REMAKE', 'REMASTER', 'EXPANDED_GAME', 'PORT', 'FORK', 'PACK', 'UPDATE');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "gameType" "GameType" NOT NULL DEFAULT 'MAINGAME',
ADD COLUMN     "keywords" INTEGER[];

-- CreateTable
CREATE TABLE "Keyword" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_slug_key" ON "Keyword"("slug");
