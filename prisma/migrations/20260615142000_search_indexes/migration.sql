CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Game_name_trgm_idx" ON "Game" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Game_keywords_gin_idx" ON "Game" USING GIN ("keywords");
CREATE INDEX IF NOT EXISTS "Game_gameType_idx" ON "Game"("gameType");
CREATE INDEX IF NOT EXISTS "Keyword_name_idx" ON "Keyword"("name");
CREATE INDEX IF NOT EXISTS "Keyword_name_trgm_idx" ON "Keyword" USING GIN (lower("name") gin_trgm_ops);
