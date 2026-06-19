ALTER TABLE "User" ALTER COLUMN "siteThemeMode" SET DEFAULT 'default';
UPDATE "User" SET "siteThemeMode" = 'default' WHERE "siteThemeMode" = 'profile';
