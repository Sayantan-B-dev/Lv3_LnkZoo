BEGIN;

ALTER TABLE links
  ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'links'
      AND column_name = 'upvote_count'
  ) THEN
    EXECUTE 'UPDATE links SET like_count = COALESCE(upvote_count, like_count, 0)';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS link_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, link_id)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'link_votes'
  ) THEN
    EXECUTE '
      INSERT INTO link_likes (user_id, link_id)
      SELECT user_id, link_id
      FROM link_votes
      WHERE vote = 1
      ON CONFLICT DO NOTHING
    ';
  END IF;
END $$;

ALTER TABLE users
  DROP COLUMN IF EXISTS karma;

ALTER TABLE links
  DROP COLUMN IF EXISTS upvote_count,
  DROP COLUMN IF EXISTS downvote_count;

ALTER TABLE comments
  DROP COLUMN IF EXISTS upvote_count;

DROP TABLE IF EXISTS link_votes;
DROP TABLE IF EXISTS comment_votes;

DROP INDEX IF EXISTS idx_links_upvotes;
CREATE INDEX IF NOT EXISTS idx_links_likes ON links(like_count DESC);

UPDATE notifications
SET type = 'like',
    message = REPLACE(message, 'upvoted your link', 'liked your link')
WHERE type = 'upvote';

COMMIT;
