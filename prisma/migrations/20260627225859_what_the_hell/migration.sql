/*
  Warnings:

  - The values [LIKED_LIST,COMMENTED_ON_LIST] on the enum `ActivityType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `gameStatus` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameDevStatus" AS ENUM ('RELEASED', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'OFFLINE', 'CANCELLED', 'RUMORED', 'DELISTED');

-- CreateEnum
CREATE TYPE "PlayerPerspective" AS ENUM ('FIRST_PERSON', 'THIRD_PERSON', 'BIRD_VIEW__SLASH_ISOMETRIC', 'SIDE_VIEW', 'TEXT', 'AUDITORY', 'VIRTUAL_REALITY');

-- AlterEnum
BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('ADDED_GAME_TO_LIBRARY', 'RATED_GAME', 'LOGGED_GAME_PLAY', 'CREATED_PLAYLIST', 'ADDED_GAME_TO_PLAYLIST', 'LIKED_GAME_LIST', 'LIKED_COMMENT', 'COMMENTED_ON_GAME_LIST', 'COMMENTED_ON_PROFILE', 'COMMENTED_ON_GAME', 'REPLIED_TO_COMMENT', 'FOLLOWED_USER', 'EARNED_BADGE');
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "public"."ActivityType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- AlterTable
ALTER TABLE "Comment" RENAME CONSTRAINT "GameListComment_pkey" TO "Comment_pkey";

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "dlcs" INTEGER[],
ADD COLUMN     "expandedGames" INTEGER[],
ADD COLUMN     "expansions" INTEGER[],
ADD COLUMN     "gameStatus" "GameDevStatus" NOT NULL,
ADD COLUMN     "multiplayerModes" INTEGER[],
ADD COLUMN     "parentGame" INTEGER,
ADD COLUMN     "playerPerspectives" "PlayerPerspective"[],
ADD COLUMN     "standaloneExpansions" INTEGER[],
ADD COLUMN     "themes" INTEGER[],
ADD COLUMN     "totalRatingCount" INTEGER,
ADD COLUMN     "versionParent" INTEGER;

-- AlterTable
ALTER TABLE "Like" RENAME CONSTRAINT "GameListLike_pkey" TO "Like_pkey";

-- CreateTable
CREATE TABLE "Theme" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiplayerMode" (
    "id" INTEGER NOT NULL,
    "game" INTEGER NOT NULL,
    "campaignCoop" BOOLEAN NOT NULL,
    "dropIn" BOOLEAN NOT NULL,
    "lanCoop" BOOLEAN NOT NULL,
    "offlineCoop" BOOLEAN NOT NULL,
    "offlineCoopMax" INTEGER NOT NULL,
    "offlineMax" INTEGER NOT NULL,
    "onlineCoop" BOOLEAN NOT NULL,
    "onlineCoopMax" INTEGER NOT NULL,
    "onlineMax" INTEGER NOT NULL,
    "platform" INTEGER NOT NULL,
    "splitscreen" BOOLEAN NOT NULL,

    CONSTRAINT "MultiplayerMode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE INDEX "Theme_name_idx" ON "Theme"("name");
