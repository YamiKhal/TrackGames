WITH unsafe_names AS (
    SELECT
        id,
        name,
        regexp_replace(name, '[^A-Za-z0-9_-]', '', 'g') AS safe_name
    FROM "User"
    WHERE name IS NOT NULL
      AND name !~ '^[A-Za-z0-9_-]{1,32}$'
)
UPDATE "User"
SET name = CASE
    WHEN unsafe_names.safe_name = '' THEN 'user-' || SUBSTRING("User".id, 1, 8)
    WHEN LENGTH(unsafe_names.safe_name) > 23 THEN LEFT(unsafe_names.safe_name, 23) || '-' || SUBSTRING("User".id, 1, 8)
    ELSE unsafe_names.safe_name || '-' || SUBSTRING("User".id, 1, 8)
END
FROM unsafe_names
WHERE "User".id = unsafe_names.id;

ALTER TABLE "User"
    ALTER COLUMN "name" TYPE VARCHAR(32);

ALTER TABLE "User"
    ADD CONSTRAINT "User_name_slug_safe_check"
    CHECK ("name" IS NULL OR "name" ~ '^[A-Za-z0-9_-]{1,32}$');
