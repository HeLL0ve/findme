-- Demo DB routines for course presentation (temporary layer above existing schema)
-- 3 procedures: create/update/select
-- 2 functions: calculations/aggregations

DROP PROCEDURE IF EXISTS sp_create_ad(TEXT, TEXT, "AdType", TEXT, TEXT, TEXT, TEXT, TEXT);
DROP PROCEDURE IF EXISTS sp_update_user_profile(TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);
DROP PROCEDURE IF EXISTS sp_select_user_ads(TEXT, INTEGER, REFCURSOR);
DROP FUNCTION IF EXISTS fn_count_unread_notifications(TEXT);
DROP FUNCTION IF EXISTS fn_user_ads_summary(TEXT);

CREATE OR REPLACE PROCEDURE sp_create_ad(
  IN p_id TEXT,
  IN p_user_id TEXT,
  IN p_type "AdType",
  IN p_description TEXT,
  IN p_pet_name TEXT DEFAULT NULL,
  IN p_animal_type TEXT DEFAULT NULL,
  IN p_breed TEXT DEFAULT NULL,
  IN p_color TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "Ad" (
    "id",
    "userId",
    "type",
    "status",
    "petName",
    "animalType",
    "breed",
    "color",
    "description",
    "updatedAt"
  )
  VALUES (
    p_id,
    p_user_id,
    p_type,
    'PENDING',
    NULLIF(BTRIM(p_pet_name), ''),
    NULLIF(BTRIM(p_animal_type), ''),
    NULLIF(BTRIM(p_breed), ''),
    NULLIF(BTRIM(p_color), ''),
    BTRIM(p_description),
    CURRENT_TIMESTAMP
  );
END;
$$;

CREATE OR REPLACE PROCEDURE sp_update_user_profile(
  IN p_user_id TEXT,
  IN p_name TEXT,
  IN p_phone TEXT,
  IN p_telegram_username TEXT,
  IN p_set_name BOOLEAN DEFAULT FALSE,
  IN p_set_phone BOOLEAN DEFAULT FALSE,
  IN p_set_telegram_username BOOLEAN DEFAULT FALSE
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "User"
  SET
    "name" = CASE WHEN p_set_name THEN NULLIF(BTRIM(COALESCE(p_name, '')), '') ELSE "name" END,
    "phone" = CASE WHEN p_set_phone THEN NULLIF(BTRIM(COALESCE(p_phone, '')), '') ELSE "phone" END,
    "telegramUsername" = CASE
      WHEN p_set_telegram_username THEN NULLIF(BTRIM(COALESCE(p_telegram_username, '')), '')
      ELSE "telegramUsername"
    END,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = p_user_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_select_user_ads(
  IN p_user_id TEXT,
  IN p_limit INTEGER DEFAULT 20,
  INOUT p_ads_cursor REFCURSOR DEFAULT 'sp_user_ads_cursor'
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN p_ads_cursor FOR
    SELECT
      a."id",
      a."type",
      a."status",
      a."petName",
      a."animalType",
      a."breed",
      a."color",
      a."description",
      a."createdAt",
      a."updatedAt"
    FROM "Ad" a
    WHERE a."userId" = p_user_id
    ORDER BY a."createdAt" DESC
    LIMIT GREATEST(COALESCE(p_limit, 20), 1);
END;
$$;

CREATE OR REPLACE FUNCTION fn_count_unread_notifications(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
    INTO unread_count
  FROM "Notification"
  WHERE "userId" = p_user_id
    AND "isRead" = false;

  RETURN unread_count;
END;
$$;

CREATE OR REPLACE FUNCTION fn_user_ads_summary(p_user_id TEXT)
RETURNS TABLE (
  total INTEGER,
  pending INTEGER,
  approved INTEGER,
  rejected INTEGER,
  archived INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE "status" = 'PENDING')::INTEGER AS pending,
    COUNT(*) FILTER (WHERE "status" = 'APPROVED')::INTEGER AS approved,
    COUNT(*) FILTER (WHERE "status" = 'REJECTED')::INTEGER AS rejected,
    COUNT(*) FILTER (WHERE "status" = 'ARCHIVED')::INTEGER AS archived
  FROM "Ad"
  WHERE "userId" = p_user_id;
END;
$$;
