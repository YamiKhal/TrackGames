CREATE INDEX IF NOT EXISTS "Game_keywords_gin_idx" ON "Game" USING GIN ("keywords");
