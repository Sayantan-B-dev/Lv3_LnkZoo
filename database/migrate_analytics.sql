-- ─────────────────────────────────────────
-- ANALYTICS & EVENT TRACKING
-- Documents saved_links (existed in live DB only) and adds
-- per-event tables for true time-series (views, clicks) plus
-- a daily_activity rollup for DAU/MAU. All idempotent.
-- ─────────────────────────────────────────

-- ── saved_links (bookmarks) — capture existing schema ──
CREATE TABLE IF NOT EXISTS saved_links (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id    UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, link_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_links_created ON saved_links(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_links_link ON saved_links(link_id);

-- ── link_view_events — one row per link-detail view ──
CREATE TABLE IF NOT EXISTS link_view_events (
  id         BIGSERIAL PRIMARY KEY,
  link_id    UUID REFERENCES links(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  referrer   TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_view_events_created ON link_view_events(created_at);
CREATE INDEX IF NOT EXISTS idx_view_events_link ON link_view_events(link_id);

-- ── link_click_events — one row per short-link redirect ──
CREATE TABLE IF NOT EXISTS link_click_events (
  id         BIGSERIAL PRIMARY KEY,
  link_id    UUID REFERENCES links(id) ON DELETE CASCADE,
  short_code VARCHAR(20),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  referrer   TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_click_events_created ON link_click_events(created_at);
CREATE INDEX IF NOT EXISTS idx_click_events_link ON link_click_events(link_id);

-- ── daily_activity — rollup for DAU/MAU (optional backfill) ──
CREATE TABLE IF NOT EXISTS daily_activity (
  date          DATE PRIMARY KEY,
  new_users     INT DEFAULT 0,
  new_links     INT DEFAULT 0,
  new_comments  INT DEFAULT 0,
  new_likes     INT DEFAULT 0,
  active_users  INT DEFAULT 0
);
