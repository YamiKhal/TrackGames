-- CreateEnum
CREATE TYPE "GameListType" AS ENUM ('LIBRARY', 'PLAYLIST');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('BACKLOG', 'PLAYING', 'COMPLETED', 'DROPPED', 'PAUSED', 'WISHLIST');

-- CreateTable
CREATE TABLE "UserGameEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'BACKLOG',
    "rating" INTEGER,
    "progress" INTEGER,
    "notes" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GameListType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "image" TEXT,
    "background" TEXT,
    "color" TEXT,
    "accentColor" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameListEntry" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "position" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserGameEntry_userId_idx" ON "UserGameEntry"("userId");

-- CreateIndex
CREATE INDEX "UserGameEntry_gameId_idx" ON "UserGameEntry"("gameId");

-- CreateIndex
CREATE INDEX "UserGameEntry_userId_status_idx" ON "UserGameEntry"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameEntry_userId_gameId_key" ON "UserGameEntry"("userId", "gameId");

-- CreateIndex
CREATE INDEX "GameList_userId_idx" ON "GameList"("userId");

-- CreateIndex
CREATE INDEX "GameList_userId_type_idx" ON "GameList"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "GameList_userId_slug_key" ON "GameList"("userId", "slug");

-- CreateIndex
CREATE INDEX "GameListEntry_listId_idx" ON "GameListEntry"("listId");

-- CreateIndex
CREATE INDEX "GameListEntry_gameId_idx" ON "GameListEntry"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameListEntry_listId_gameId_key" ON "GameListEntry"("listId", "gameId");

-- AddForeignKey
ALTER TABLE "UserGameEntry" ADD CONSTRAINT "UserGameEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameEntry" ADD CONSTRAINT "UserGameEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameList" ADD CONSTRAINT "GameList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameListEntry" ADD CONSTRAINT "GameListEntry_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GameList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameListEntry" ADD CONSTRAINT "GameListEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
