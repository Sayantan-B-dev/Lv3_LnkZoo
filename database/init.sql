CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username         VARCHAR(50)  UNIQUE NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    TEXT,                          -- nullable for OAuth-only accounts
  google_id        TEXT UNIQUE,                   -- Google OAuth subject
  avatar_url       TEXT,
  cover_url        TEXT,
  bio              TEXT,
  website          TEXT,
  interests        TEXT[]       DEFAULT '{}',     -- tag names user cares about
  streak           INT          DEFAULT 0,
  last_post_date   DATE,
  is_admin         BOOLEAN      DEFAULT false,
  is_banned        BOOLEAN      DEFAULT false,
  created_at       TIMESTAMP    DEFAULT NOW(),
  updated_at       TIMESTAMP    DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FOLLOWS & BLOCKS
-- ─────────────────────────────────────────
CREATE TABLE follows (
  follower_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  followee_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE blocks (
  blocker_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ─────────────────────────────────────────
-- TAGS
-- ─────────────────────────────────────────
CREATE TABLE tags (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) UNIQUE NOT NULL,
  normalized_name  VARCHAR(100) UNIQUE NOT NULL,  -- lowercase, trimmed
  usage_count      INT DEFAULT 0
);

-- ─────────────────────────────────────────
-- LINKS
-- ─────────────────────────────────────────
CREATE TABLE links (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  original_url          TEXT    NOT NULL,
  short_code            VARCHAR(20) UNIQUE,        -- 6-char base62, auto-generated
  title                 VARCHAR(500) NOT NULL,
  description           TEXT,
  preview_image         TEXT,                      -- OG image scraped from URL
  is_private            BOOLEAN DEFAULT false,
  private_allowed_users UUID[]  DEFAULT '{}',      -- user IDs who can see private link
  is_anonymous          BOOLEAN DEFAULT false,     -- hide poster identity
  is_promoted           BOOLEAN DEFAULT false,
  flagged_count         INT     DEFAULT 0,
  like_count            INT     DEFAULT 0,
  comment_count         INT     DEFAULT 0,
  view_count            INT     DEFAULT 0,
  click_count           INT     DEFAULT 0,         -- short link clicks
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LINK ↔ TAG (many-to-many)
-- ─────────────────────────────────────────
CREATE TABLE link_tags (
  link_id  UUID REFERENCES links(id) ON DELETE CASCADE,
  tag_id   INT  REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- ─────────────────────────────────────────
-- LINK LIKES
-- ─────────────────────────────────────────
CREATE TABLE link_likes (
  user_id    UUID      REFERENCES users(id) ON DELETE CASCADE,
  link_id    UUID      REFERENCES links(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, link_id)
);

-- ─────────────────────────────────────────
-- COMMENTS (infinite nesting)
-- ─────────────────────────────────────────
CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id       UUID REFERENCES links(id)    ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id)    ON DELETE SET NULL,
  parent_id     UUID REFERENCES comments(id) ON DELETE CASCADE,
  content       TEXT    NOT NULL,
  is_deleted    BOOLEAN DEFAULT false,         -- soft delete (keep thread shape)
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SHORTENED LINKS (standalone tool)
-- ─────────────────────────────────────────
CREATE TABLE shortened_links (
  id            SERIAL PRIMARY KEY,
  short_code    VARCHAR(20) UNIQUE NOT NULL,
  original_url  TEXT NOT NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  click_count   INT  DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,  -- recipient
  actor_id   UUID REFERENCES users(id) ON DELETE SET NULL, -- who triggered it
  type       VARCHAR(50) NOT NULL,  -- 'reply' | 'follow' | 'like' | 'mention'
  entity_id  UUID,                  -- link_id or comment_id
  message    TEXT,
  is_read    BOOLEAN   DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_links_user_id        ON links(user_id);
CREATE INDEX idx_links_created_at     ON links(created_at DESC);
CREATE INDEX idx_links_short_code     ON links(short_code);
CREATE INDEX idx_links_likes          ON links(like_count DESC);
CREATE INDEX idx_comments_link_id     ON comments(link_id);
CREATE INDEX idx_comments_parent_id   ON comments(parent_id);
CREATE INDEX idx_tags_normalized      ON tags(normalized_name);
CREATE INDEX idx_link_tags_tag_id     ON link_tags(tag_id);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
CREATE INDEX idx_follows_follower     ON follows(follower_id);
CREATE INDEX idx_follows_followee     ON follows(followee_id);
CREATE INDEX idx_link_likes_link_id   ON link_likes(link_id);
