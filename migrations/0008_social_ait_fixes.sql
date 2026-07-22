-- Unique like per user/post (prevents duplicate likes)
CREATE UNIQUE INDEX IF NOT EXISTS post_likes_user_post_unique ON post_likes (user_id, post_id);

-- Room-level spotlight entitlements
ALTER TABLE ait_entitlements ADD COLUMN IF NOT EXISTS entity_id varchar(100);
