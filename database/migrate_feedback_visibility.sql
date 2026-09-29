-- Feedback becomes a public board: everyone can read public reports, and each
-- report carries its own visibility chosen by the author at post time.
--
--   public  -> listed for everyone (including signed-out visitors)
--   private -> only the author and admins ever see it
--
-- Defaults to 'public' so the board is informative; existing rows (if any) are
-- backfilled to 'public' by the DEFAULT.

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_feedback_visibility ON feedback(visibility);
