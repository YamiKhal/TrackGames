CREATE TABLE "UserTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "normalized" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserGameEntryTag" (
    "entryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "UserGameEntryTag_pkey" PRIMARY KEY ("entryId","tagId")
);

CREATE UNIQUE INDEX "UserTag_userId_normalized_key" ON "UserTag"("userId", "normalized");
CREATE INDEX "UserTag_userId_idx" ON "UserTag"("userId");
CREATE INDEX "UserGameEntryTag_tagId_idx" ON "UserGameEntryTag"("tagId");

ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGameEntryTag" ADD CONSTRAINT "UserGameEntryTag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "UserGameEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGameEntryTag" ADD CONSTRAINT "UserGameEntryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "UserTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
