-- AlterTable
ALTER TABLE "User"
ADD COLUMN "bio" TEXT,
ADD COLUMN "profileColor" TEXT,
ADD COLUMN "accentColor" TEXT,
ADD COLUMN "privacy" TEXT NOT NULL DEFAULT 'public',
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "socials" TEXT,
ADD COLUMN "preferences" TEXT,
ADD COLUMN "widgets" TEXT;
