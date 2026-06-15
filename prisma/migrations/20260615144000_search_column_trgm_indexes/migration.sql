CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Game_name_column_trgm_idx" ON "Game" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Keyword_name_column_trgm_idx" ON "Keyword" USING GIN ("name" gin_trgm_ops);
