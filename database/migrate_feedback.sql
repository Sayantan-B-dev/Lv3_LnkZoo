-- Bug reports / feedback, posted by signed-in users, triaged by admins.
--
-- ON DELETE SET NULL (not CASCADE): a bug report is worth keeping even after
-- the reporter deletes their account — it just becomes unattributed.
-- screenshot_public_id is stored so the Cloudinary asset can be torn down
-- when a report is deleted, instead of leaking storage forever.

CREATE TABLE IF NOT EXISTS feedback (
  id                   SERIAL PRIMARY KEY,
  user_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  screenshot_url       TEXT,
  screenshot_public_id TEXT,
  status               TEXT NOT NULL DEFAULT 'open',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by          UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id    ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status     ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
