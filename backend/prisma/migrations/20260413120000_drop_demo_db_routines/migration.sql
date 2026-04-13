-- Rollback for temporary DB routines added for course presentation.
-- Keeps the main schema intact and only removes demo procedures/functions.

DROP PROCEDURE IF EXISTS sp_create_ad(TEXT, TEXT, "AdType", TEXT, TEXT, TEXT, TEXT, TEXT);
DROP PROCEDURE IF EXISTS sp_update_user_profile(TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);
DROP PROCEDURE IF EXISTS sp_select_user_ads(TEXT, INTEGER, REFCURSOR);

DROP FUNCTION IF EXISTS fn_count_unread_notifications(TEXT);
DROP FUNCTION IF EXISTS fn_user_ads_summary(TEXT);
