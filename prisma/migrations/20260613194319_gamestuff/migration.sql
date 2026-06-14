-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "totalRating" DOUBLE PRECISION,
    "releaseDate" TIMESTAMP(3),
    "cover" TEXT,
    "screenshots" TEXT[],
    "videos" TEXT[],
    "developer" TEXT[],
    "publisher" TEXT[],
    "platforms" TEXT[],
    "genres" TEXT[],
    "franchises" TEXT[],
    "collections" TEXT[],
    "similarGames" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
