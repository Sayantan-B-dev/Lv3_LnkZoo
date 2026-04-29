# Glinqx – System Requirements Specification
### Next.js 14 · TypeScript · Pure CSS · PostgreSQL

> **Glinqx** is a social link-sharing app — post, discover, vote, and discuss URLs with a community. Think Reddit meets Pinboard, built completely on free-tier infrastructure.

---

## Table of Contents

1. [Product Vision & Must-Have Features](#1-product-vision--must-have-features)
2. [Tech Stack](#2-tech-stack)
3. [CSS Architecture](#3-css-architecture-pure-css-no-frameworks)
4. [Database Schema](#4-database-schema-postgresql)
5. [API Routes](#5-api-routes)
6. [Frontend Pages](#6-frontend-pages)
7. [Folder Structure](#7-folder-structure)
8. [Step-by-Step Build Plan](#8-step-by-step-build-plan)
9. [Infinite Nested Comments](#9-infinite-nested-comments-reddit-style)
10. [Advanced Features Map](#10-advanced-features-map)
11. [Frontend Advanced Concepts](#11-frontend-advanced-concepts)
12. [Performance & Free Tier Optimizations](#12-performance--free-tier-optimizations)
13. [Environment Variables & Deployment](#13-environment-variables--deployment)
14. [System Design Diagram](#14-system-design-diagram)
15. [Final Checklist Before Launch](#15-final-checklist-before-launch)

---

## 1. Product Vision & Must-Have Features

### 1.1 Must-Have (no compromise)

| # | Feature | Notes |
|---|---------|-------|
| 1 | User system | Register, login (email+password hashed with bcrypt), Google OAuth, profile, follow/unfollow, block |
| 2 | Link CRUD | Post URL + title + description + tags; edit/delete; upvote/downvote |
| 3 | Link preview | Auto-fetch title, image, description via cheerio scraper on submit |
| 4 | Private links | Visible only to allowed user IDs set by the owner |
| 5 | Link shortener | Every link gets a `short_code`; standalone tool too; click tracking |
| 6 | Infinite nested comments | Reddit-style threading, recursive CTE, upvote only |
| 7 | Social feed | Home feed = followed users; Explore = global |
| 8 | Leaderboard | Global + per-tag; period: week / month / all-time |
| 9 | Recommendations | Slider based on user interests/tags |
| 10 | Random link | Button that fetches a random public link |
| 11 | Daily Dose | Curated "top links of the day" page |
| 12 | Notifications | Reply, follow, mention — polled every 30s |
| 13 | Gamification | Streaks (daily post), karma, badges |
| 14 | Moderation | Flag links; admin panel to delete flagged content |
| 15 | Anonymous posting | Post a link without showing your username |
| 16 | PWA | Installable on mobile, offline shell via service worker |
| 17 | Auto-tagging | Extract keywords from title+description on link save |
| 18 | Daily digest email | Top 5 links from followed users sent every morning |

### 1.2 Explicitly NOT in scope

- ❌ Chat rooms / WebSockets / real-time messaging (any kind)
- ❌ D3.js graph visualization
- ❌ Link reactions (❤️ 🔥 etc.) — only upvote / downvote on links

---

## 2. Tech Stack

| Area | Technology |
|------|-----------|
| Frontend + Backend | Next.js 14 (App Router) |
| Language | TypeScript 5.x |
| Styling | Pure CSS + CSS Modules (no Tailwind, no frameworks) |
| State management | React Context + useReducer |
| Database | PostgreSQL 14+ via [Neon.tech](https://neon.tech) (free tier) |
| DB driver | `pg` — raw SQL only |
| Auth | JWT (httpOnly cookie) + bcrypt + Google OAuth (next-auth or custom) |
| Scraping | cheerio + node-fetch |
| Cron jobs | [cron-job.org](https://cron-job.org) calling API endpoints |
| Deployment | Vercel (free tier) |

No paid services. No Tailwind. No WebSockets. No Socket.io. No D3.

---

## 3. CSS Architecture (Pure CSS, No Frameworks)

### 3.1 Global files — `styles/` folder

| File | Purpose |
|------|---------|
| `globals.css` | Entry point — imports all below |
| `variables.css` | CSS custom properties: colors, spacing, radius, breakpoints |
| `typography.css` | Headings, body text, links, font loading |
| `utilities.css` | Helper classes: `.flex`, `.mt-2`, `.text-center`, etc. |
| `animations.css` | `@keyframes`, transitions, skeleton loaders |
| `themes/light.css` | Light theme (dark theme optional later) |

### 3.2 Component CSS — CSS Modules

Every `.tsx` component has a matching `.module.css` in the same folder.

```
LinkCard.tsx  +  LinkCard.module.css
CommentItem.tsx  +  CommentItem.module.css
```

### 3.3 BEM naming inside modules (optional but recommended)

```css
.link-card { }
.link-card__title { }
.link-card--featured { }
```

### 3.4 Responsive breakpoints (in `variables.css`)

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
```

---

## 4. Database Schema (PostgreSQL)

Run `database/init.sql` once on your Neon.tech database.

```sql
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
  bio              TEXT,
  website          TEXT,
  interests        TEXT[]       DEFAULT '{}',     -- tag names user cares about
  karma            INT          DEFAULT 0,
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
  upvote_count          INT     DEFAULT 0,
  downvote_count        INT     DEFAULT 0,
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
-- LINK VOTES (upvote = 1, downvote = -1)
-- ─────────────────────────────────────────
CREATE TABLE link_votes (
  user_id  UUID     REFERENCES users(id) ON DELETE CASCADE,
  link_id  UUID     REFERENCES links(id) ON DELETE CASCADE,
  vote     SMALLINT CHECK (vote IN (1, -1)),
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
  upvote_count  INT     DEFAULT 0,
  is_deleted    BOOLEAN DEFAULT false,         -- soft delete (keep thread shape)
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- COMMENT VOTES (upvote only)
-- ─────────────────────────────────────────
CREATE TABLE comment_votes (
  user_id    UUID REFERENCES users(id)    ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, comment_id)
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
  type       VARCHAR(50) NOT NULL,  -- 'reply' | 'follow' | 'upvote' | 'mention'
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
CREATE INDEX idx_links_upvotes        ON links(upvote_count DESC);
CREATE INDEX idx_comments_link_id     ON comments(link_id);
CREATE INDEX idx_comments_parent_id   ON comments(parent_id);
CREATE INDEX idx_tags_normalized      ON tags(normalized_name);
CREATE INDEX idx_link_tags_tag_id     ON link_tags(tag_id);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
CREATE INDEX idx_follows_follower     ON follows(follower_id);
CREATE INDEX idx_follows_followee     ON follows(followee_id);
```

---

## 5. API Routes

All routes live in `app/api/`. JWT is stored in an `httpOnly` cookie. `middleware.ts` validates it for all protected routes.

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register with email + password (bcrypt) |
| POST | `/api/auth/login` | — | Login, set JWT cookie |
| POST | `/api/auth/logout` | ✓ | Clear JWT cookie |
| GET | `/api/auth/me` | ✓ | Current user info |
| GET | `/api/auth/google` | — | Google OAuth redirect |
| GET | `/api/auth/google/callback` | — | OAuth callback, sync by email, set cookie |

### Links

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/links` | optional | Feed — `?mode=following` or `?mode=explore`; cursor pagination |
| POST | `/api/links` | ✓ | Create link (scrape preview, auto-tag, generate short_code) |
| GET | `/api/links/:id` | optional | Single link (increment view_count) |
| PUT | `/api/links/:id` | ✓ | Edit link (owner only) |
| DELETE | `/api/links/:id` | ✓ | Delete link (owner or admin) |
| POST | `/api/links/:id/vote` | ✓ | Upvote/downvote `{ vote: 1 \| -1 }` |
| POST | `/api/links/:id/flag` | ✓ | Flag link (increments flagged_count) |
| GET | `/api/links/random` | — | Random public link |
| GET | `/api/links/daily-dose` | — | Top 5 links of today |

### Comments

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/comments/link/:linkId` | optional | Recursive comment tree (CTE) |
| POST | `/api/comments` | ✓ | New comment `{ link_id, content, parent_id? }` |
| PUT | `/api/comments/:id` | ✓ | Edit comment (owner only) |
| DELETE | `/api/comments/:id` | ✓ | Soft-delete comment (owner or admin) |
| POST | `/api/comments/:id/vote` | ✓ | Upvote comment |

### Users

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/users/:username` | — | Public profile |
| PUT | `/api/users/me` | ✓ | Update own profile (bio, avatar, interests, website) |
| POST | `/api/users/:id/follow` | ✓ | Follow user |
| DELETE | `/api/users/:id/follow` | ✓ | Unfollow user |
| POST | `/api/users/:id/block` | ✓ | Block user |
| DELETE | `/api/users/:id/block` | ✓ | Unblock user |
| GET | `/api/users/:id/followers` | — | Paginated follower list |
| GET | `/api/users/:id/following` | — | Paginated following list |
| GET | `/api/users/:id/links` | optional | User's public links (paginated) |

### Tags

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tags` | — | All tags sorted by usage_count |
| GET | `/api/tags/:name/links` | optional | Links for a tag (paginated) |

### Discovery & Social

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/leaderboard` | — | Top users by karma; `?period=week\|month\|all` |
| GET | `/api/recommendations` | ✓ | Links recommended by user interests |
| GET | `/api/notifications` | ✓ | Unread notifications |
| POST | `/api/notifications/mark-read` | ✓ | Mark all or specific IDs as read |

### Tools

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/tools/shorten` | optional | Shorten any URL (standalone tool) |
| POST | `/api/tools/parse` | — | Scrape metadata from a URL |
| GET | `/s/:code` | — | Short link redirect (checks links then shortened_links, then 302) |

### Admin

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/flagged-links` | admin | List links with flagged_count > 0 |
| DELETE | `/api/admin/links/:id` | admin | Force-delete any link |
| POST | `/api/admin/ban/:userId` | admin | Ban a user |

### Cron (called by cron-job.org with `?secret=CRON_SECRET`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/cron/streaks` | Update streaks + award badges (daily 00:00) |
| POST | `/api/cron/daily-digest` | Send top-links email digest (daily 09:00) |

---

## 6. Frontend Pages

All pages under `app/`. Route groups: `(auth)` and `(main)`.

| URL | Page Component | Description |
|-----|---------------|-------------|
| `/` | `HomePage` | Social feed (following + recommendations) |
| `/explore` | `ExplorePage` | Global links, tag cloud, trending |
| `/login` | `LoginPage` | Email/password + Google OAuth button |
| `/register` | `RegisterPage` | Registration with interest selection |
| `/profile/:username` | `ProfilePage` | User bio, karma, links, follow button |
| `/link/:id` | `LinkDetailPage` | Link + nested comments |
| `/submit` | `SubmitLinkPage` | Form to post a new link |
| `/leaderboard` | `LeaderboardPage` | Global leaderboard (week/month/all) |
| `/random` | `RandomPage` | Redirects to a random link |
| `/daily-dose` | `DailyDosePage` | Today's top 5 curated links |
| `/tags/:name` | `TagPage` | All links for a tag |
| `/tools` | `ToolsPage` | Two tabs: shortener + parser |

---

## 7. Folder Structure

**Naming rules:**
- API route files: `route.ts` inside feature folders
- Services: `*.service.ts`
- Components: `PascalCase.tsx` + `PascalCase.module.css`
- Pages: `page.tsx`

```
glinqx/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── page.tsx                     ← Home feed
│   │   ├── explore/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── random/page.tsx
│   │   ├── daily-dose/page.tsx
│   │   ├── submit/page.tsx
│   │   ├── tools/page.tsx
│   │   ├── profile/[username]/page.tsx
│   │   ├── link/[id]/page.tsx
│   │   └── tags/[name]/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   ├── google/route.ts
│   │   │   └── google/callback/route.ts
│   │   ├── links/
│   │   │   ├── route.ts
│   │   │   ├── random/route.ts
│   │   │   ├── daily-dose/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── vote/route.ts
│   │   │       └── flag/route.ts
│   │   ├── comments/
│   │   │   ├── route.ts
│   │   │   ├── link/[linkId]/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── vote/route.ts
│   │   ├── users/
│   │   │   ├── me/route.ts
│   │   │   └── [id]/
│   │   │       ├── follow/route.ts
│   │   │       ├── block/route.ts
│   │   │       ├── followers/route.ts
│   │   │       ├── following/route.ts
│   │   │       └── links/route.ts
│   │   ├── tags/
│   │   │   ├── route.ts
│   │   │   └── [name]/links/route.ts
│   │   ├── leaderboard/route.ts
│   │   ├── recommendations/route.ts
│   │   ├── notifications/
│   │   │   ├── route.ts
│   │   │   └── mark-read/route.ts
│   │   ├── tools/
│   │   │   ├── shorten/route.ts
│   │   │   └── parse/route.ts
│   │   ├── admin/
│   │   │   ├── flagged-links/route.ts
│   │   │   ├── links/[id]/route.ts
│   │   │   └── ban/[userId]/route.ts
│   │   └── cron/
│   │       ├── streaks/route.ts
│   │       └── daily-digest/route.ts
│   ├── s/[code]/route.ts               ← Short link redirect
│   ├── layout.tsx
│   └── not-found.tsx
├── components/
│   ├── common/
│   │   ├── Navbar.tsx + .module.css
│   │   ├── Footer.tsx + .module.css
│   │   ├── LoadingSpinner.tsx + .module.css
│   │   ├── ErrorMessage.tsx
│   │   └── NotificationBell.tsx + .module.css
│   ├── links/
│   │   ├── LinkCard.tsx + .module.css
│   │   ├── LinkForm.tsx + .module.css
│   │   ├── VoteButtons.tsx + .module.css
│   │   ├── LinkPreview.tsx + .module.css
│   │   └── TagBadge.tsx + .module.css
│   ├── comments/
│   │   ├── CommentThread.tsx + .module.css
│   │   ├── CommentItem.tsx + .module.css
│   │   └── CommentForm.tsx + .module.css
│   └── recommendations/
│       └── Slider.tsx + .module.css
├── lib/
│   ├── db.ts                           ← pg pool
│   ├── auth.ts                         ← JWT sign/verify helpers
│   └── shortCode.ts                    ← base62 generator
├── services/
│   ├── linkParser.service.ts           ← cheerio scraper
│   ├── autoTag.service.ts              ← keyword extraction
│   ├── gamification.service.ts         ← streaks, karma, badges
│   ├── notification.service.ts         ← create notifications
│   ├── shortCode.service.ts            ← generate + store short codes
│   └── dailyDigest.service.ts          ← email digest
├── hooks/
│   ├── useAuth.ts
│   ├── useInfiniteScroll.ts
│   └── useNotifications.ts             ← polls /api/notifications every 30s
├── context/
│   ├── AuthContext.tsx
│   └── NotificationContext.tsx
├── styles/
│   ├── globals.css
│   ├── variables.css
│   ├── typography.css
│   ├── utilities.css
│   ├── animations.css
│   └── themes/light.css
├── public/
│   ├── manifest.json
│   └── sw.js
├── middleware.ts
├── next.config.js
├── package.json
├── tsconfig.json
├── .env.local
└── database/
    └── init.sql
```

---

## 8. Step-by-Step Build Plan

Follow these steps in order. Each step produces something fully working before you move on.

---

### STEP 1 — Project Setup

**Goal:** A running Next.js app with TypeScript and folder structure ready.

```bash
npx create-next-app@14 glinqx \
  --typescript \
  --app \
  --no-tailwind \
  --eslint \
  --src-dir=false \
  --import-alias "@/*"

cd glinqx
npm install pg bcryptjs jose cheerio node-fetch nodemailer
npm install --save-dev @types/pg @types/bcryptjs @types/nodemailer
```

- Create the full folder tree from Section 7.
- Set up `styles/variables.css`, `styles/globals.css`, `styles/typography.css`, `styles/utilities.css`.
- Build `Navbar.tsx` and basic `layout.tsx`.
- Verify: `npm run dev` shows a styled blank homepage.

---

### STEP 2 — Database Setup

**Goal:** PostgreSQL schema fully created on Neon.tech.

1. Create a free database at [neon.tech](https://neon.tech).
2. Copy the connection string into `.env.local` as `DATABASE_URL`.
3. Write `database/init.sql` from Section 4 (all tables + indexes).
4. Run it:  
   ```bash
   psql $DATABASE_URL -f database/init.sql
   ```
5. Create `lib/db.ts`:
   ```ts
   import { Pool } from "pg";
   const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
   export default pool;
   ```
6. Verify: write a quick test route `GET /api/health` that runs `SELECT NOW()` and returns the timestamp.

---

### STEP 3 — Basic Link CRUD

**Goal:** Create, read, update, delete links with no auth. Confirm the core data model works.

- `POST /api/links` — insert a link, return created row.
- `GET /api/links` — list all links, newest first, simple pagination (`?page=1`).
- `GET /api/links/:id` — get single link.
- `PUT /api/links/:id` — update title/description.
- `DELETE /api/links/:id` — delete.
- No auth yet. No scraping yet. Just raw CRUD.
- Build `LinkCard.tsx` to display a link. Wire it up to the home page.
- Verify with Postman or the UI that all 5 operations work.

---

### STEP 4 — Auth: Email/Password + Google OAuth

**Goal:** Users can register, log in, and stay logged in via cookie. Google OAuth syncs on matching email.

#### 4a. Email / Password

- `POST /api/auth/register` — validate, hash password with bcrypt, insert user, return JWT cookie.
- `POST /api/auth/login` — verify email + bcrypt, return JWT cookie.
- `POST /api/auth/logout` — clear cookie.
- `GET /api/auth/me` — verify JWT, return user.
- JWT signed with `jose`, stored in `httpOnly; SameSite=Strict` cookie.
- `middleware.ts` — protect all routes except `auth/*`, `s/*`, `tools/parse`.
- Build `LoginPage` and `RegisterPage` with interest selection checkboxes.
- `AuthContext` wraps the app, holds `user` state, calls `/api/auth/me` on mount.

#### 4b. Google OAuth

- `GET /api/auth/google` — redirect to Google consent screen.
- `GET /api/auth/google/callback` — receive code, fetch user profile from Google.
  - If email exists in `users` → update `google_id`, log in.
  - If not → create new user (no password_hash), log in.
- Same JWT cookie flow as email auth.
- Add Google login button to `LoginPage`.

#### Verify:
- Register with email → JWT cookie set → `/api/auth/me` returns user.
- Register again with same email → 400 error.
- Google login with same email → same user account.
- Protected route without cookie → 401.

---

### STEP 5 — Full User Routes

**Goal:** Profiles, follow/unfollow, block, profile editing.

- `GET /api/users/:username` — public profile with follower/following counts, recent links.
- `PUT /api/users/me` — update bio, avatar_url, website, interests.
- `POST /api/users/:id/follow` — insert into follows.
- `DELETE /api/users/:id/follow` — delete from follows.
- `POST /api/users/:id/block` — insert into blocks; blocked users are excluded from feeds.
- `GET /api/users/:id/followers` — paginated list.
- `GET /api/users/:id/following` — paginated list.
- `GET /api/users/:id/links` — paginated list of user's public links.
- Build `ProfilePage` showing avatar, bio, karma, streak, follow button, links grid.

---

### STEP 6 — Full Link Routes

**Goal:** Complete link system with preview scraping, short codes, voting, private links, anonymous posting.

#### 6a. Link creation enhancements (add to `POST /api/links`)

- Auto-scrape title, description, preview_image via `linkParser.service.ts` (cheerio).
- Generate 6-char base62 `short_code` and store it.
- Support `is_private` + `private_allowed_users` array.
- Support `is_anonymous` flag.
- Auto-tag via `autoTag.service.ts` — extract top keywords from title+description, create missing tags, associate top 3.

#### 6b. Feed with cursor pagination

- `GET /api/links?mode=following&cursor=<timestamp>` — links from followed users.
- `GET /api/links?mode=explore&cursor=<timestamp>` — all public links.
- Filter out links from blocked users.
- For private links: only return if `user_id` is in `private_allowed_users`.
- Promoted links sorted first within their time block.

#### 6c. Voting

- `POST /api/links/:id/vote` with `{ vote: 1 | -1 }`.
- Upsert into `link_votes`. Recompute `upvote_count` / `downvote_count` on `links`.
- Increment poster's `karma` on upvote (+1), decrement on downvote (−1).
- Optimistic UI on the frontend: update count immediately, revert on error.

#### 6d. Short link redirect

- `GET /s/:code` — look up in `links.short_code` first, then `shortened_links.short_code`.
- Increment `click_count`.
- `302` redirect to `original_url`.

#### 6e. Other link routes

- `GET /api/links/random` — `SELECT * FROM links WHERE is_private=false ORDER BY RANDOM() LIMIT 1`.
- `GET /api/links/daily-dose` — top 5 links by upvote_count created in the last 24 hours.
- `POST /api/links/:id/flag` — increment `flagged_count`.
- Build `VoteButtons.tsx`, `LinkPreview.tsx`, `TagBadge.tsx`.

---

### STEP 7 — Full Comment Routes

**Goal:** Infinite nested comments working end-to-end.

- `GET /api/comments/link/:linkId` — recursive CTE query (see Section 9).
- `POST /api/comments` — insert comment, increment `links.comment_count`, create notification for link owner.
- `PUT /api/comments/:id` — edit own comment.
- `DELETE /api/comments/:id` — soft delete (`is_deleted = true`), show "[deleted]" in UI.
- `POST /api/comments/:id/vote` — upsert into `comment_votes`, increment `upvote_count`.
- Build `CommentThread.tsx` (recursive), `CommentItem.tsx`, `CommentForm.tsx`.
- Inline reply form below each comment.

---

### STEP 8 — Discovery & Social Routes

**Goal:** Leaderboard, recommendations, daily dose, random, notifications.

- `GET /api/leaderboard?period=week|month|all` — users ranked by karma or link upvotes in period.
- `GET /api/recommendations` — links whose tags overlap with `users.interests`, excluding already-seen.
- `GET /api/notifications` — unread notifications; polled by `useNotifications` hook every 30s.
- `POST /api/notifications/mark-read` — mark as read.
- `GET /api/tags` — all tags sorted by `usage_count DESC`.
- `GET /api/tags/:name/links` — paginated links for a tag.
- Build `LeaderboardPage`, `DailyDosePage`, `TagPage`, `NotificationBell` component.
- Build `Slider.tsx` recommendations carousel on the homepage sidebar.

---

### STEP 9 — Infinite Nested Comments (Deep Dive)

**Goal:** Comments load as a full tree in one query; reply forms work at any depth.

#### Backend — recursive CTE

```sql
WITH RECURSIVE comment_tree AS (
  -- Root comments (no parent)
  SELECT
    id, parent_id, user_id, content, upvote_count, is_deleted, created_at,
    0 AS depth,
    ARRAY[id] AS path
  FROM comments
  WHERE link_id = $1 AND parent_id IS NULL

  UNION ALL

  -- Recursive case: children
  SELECT
    c.id, c.parent_id, c.user_id, c.content, c.upvote_count, c.is_deleted, c.created_at,
    ct.depth + 1,
    ct.path || c.id
  FROM comments c
  JOIN comment_tree ct ON c.parent_id = ct.id
)
SELECT * FROM comment_tree ORDER BY path;
```

Build tree in memory on the server before returning:

```ts
function buildTree(flat: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }
  for (const c of flat) {
    if (c.parent_id) {
      map.get(c.parent_id)?.replies.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  }
  return roots;
}
```

#### Frontend — recursive component

```tsx
function CommentThread({ comments, linkId, depth = 0 }) {
  return (
    <>
      {comments.map(comment => (
        <div key={comment.id} style={{ marginLeft: depth * 20 }}>
          <CommentItem comment={comment} linkId={linkId} depth={depth} />
          {comment.replies?.length > 0 && (
            <CommentThread
              comments={comment.replies}
              linkId={linkId}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </>
  );
}
```

- Collapse threads at depth > 5 with "show more replies" button.
- Soft-deleted comments show `[deleted]` but keep their children visible.

---

### STEP 10 — Tools Page

**Goal:** Standalone link shortener and link metadata parser.

- `POST /api/tools/shorten` — generate short_code, insert into `shortened_links`, return short URL.
- `POST /api/tools/parse` — scrape URL with cheerio, return `{ title, description, image, favicon }`.
- `GET /s/:code` — already built in Step 6.
- Build `ToolsPage` with two CSS-only tabs (input → output for each tool).
- Copy-to-clipboard button on the shortened URL output.

---

### STEP 11 — Gamification, Moderation & Admin

**Goal:** Streaks, karma, badges, flag system, admin panel.

#### Gamification

- `POST /api/cron/streaks` (called daily at 00:00):
  - If `last_post_date = yesterday` → increment `streak`.
  - Else if `last_post_date < yesterday` → reset `streak = 0`.
  - Award badges: `karma > 100` → Bronze, `> 500` → Silver, `> 1000` → Gold.
  - Store badges as a `badges TEXT[]` column on users (add to schema).

#### Moderation

- `POST /api/links/:id/flag` increments `flagged_count`.
- `GET /api/admin/flagged-links` — links where `flagged_count >= 3`.
- `DELETE /api/admin/links/:id` — hard-delete (admin only).
- `POST /api/admin/ban/:userId` — set `users.is_banned = true`.
- Banned users cannot log in; their links are hidden from public feeds.

---

### STEP 12 — Advanced Features & Polish

**Goal:** PWA, email digest, anonymous posting, promoted links, welcome message, responsive design.

- **PWA:** Add `public/manifest.json` and `public/sw.js`. Register SW in `layout.tsx`. Cache static shell.
- **Email digest:** `POST /api/cron/daily-digest` — fetch top 5 links from followed users in last 24h, send via nodemailer (Gmail SMTP).
- **Anonymous posting:** `SubmitLinkPage` has "Post anonymously" checkbox. If checked, store `is_anonymous=true` on link. In `LinkCard`, display "Anonymous" instead of username.
- **Promoted links:** `is_promoted=true` links appear first in feed (admin can toggle).
- **Welcome message:** After first link post (user's `link_count == 1`), auto-create a system notification: "Welcome to Glinqx! 🎉 You just posted your first link."
- **Responsive design:** Test and fix all pages at 320px, 768px, 1024px.
- **Infinite scroll:** Add `useInfiniteScroll` hook with IntersectionObserver to home feed and explore page.
- **Debounced tag search:** In link submit form, debounce tag input with 300ms.

---

### STEP 13 — Testing & Deployment

**Goal:** App is live on Vercel, all features verified.

1. Run `npm run build` — fix all TypeScript and build errors.
2. Test all API endpoints with Postman or Thunder Client.
3. Test on mobile viewport (320px).
4. Push to GitHub.
5. Create project on Vercel, set environment variables (see Section 13).
6. Run `database/init.sql` on Neon.tech production DB.
7. Deploy via Vercel.
8. Set up cron jobs on cron-job.org:
   - `POST https://yourdomain.com/api/cron/streaks?secret=CRON_SECRET` — daily 00:00
   - `POST https://yourdomain.com/api/cron/daily-digest?secret=CRON_SECRET` — daily 09:00
9. Install as PWA on mobile and verify it works.

---

## 9. Infinite Nested Comments (Reddit Style)

See **Step 9** above for the full recursive CTE query and frontend component.

**Key design decisions:**
- Soft delete preserves thread structure (`is_deleted=true` → show `[deleted]`).
- `path` array in CTE ensures correct ordering of deeply nested threads.
- Threads collapse at depth > 5 to avoid runaway nesting on screen.
- `comment_count` on `links` is a denormalized counter — increment on create, decrement on hard delete.

---

## 10. Advanced Features Map

| # | Feature | File | Notes |
|---|---------|------|-------|
| 1 | Auto-tagging | `services/autoTag.service.ts` | TF-IDF lite on title+desc; create tags if missing; associate top 3 |
| 2 | Streaks & Badges | `services/gamification.service.ts` | Daily cron; badges stored in `users.badges TEXT[]` |
| 3 | Moderation & Admin | `app/api/admin/` | Flag → review → delete or dismiss |
| 4 | Daily digest email | `services/dailyDigest.service.ts` | nodemailer + Gmail SMTP; daily 09:00 cron |
| 5 | Anonymous posting | `SubmitLinkPage` checkbox | `is_anonymous=true`; show "Anonymous" in card |
| 6 | Promoted links | `links.is_promoted` | Admin toggles; sorted first in feed |
| 7 | PWA | `public/manifest.json`, `sw.js` | Service worker caches shell |
| 8 | Click tracking | `links.click_count`, `shortened_links.click_count` | Incremented on each redirect |
| 9 | Welcome notification | `notification.service.ts` | Triggered on first link post |
| 10 | Random link | `GET /api/links/random` | `ORDER BY RANDOM() LIMIT 1` |
| 11 | Daily Dose | `GET /api/links/daily-dose` | Top 5 upvoted in last 24h |
| 12 | Infinite scroll | `hooks/useInfiniteScroll.ts` | IntersectionObserver + cursor pagination |

---

## 11. Frontend Advanced Concepts

- **Context + useReducer** — `AuthContext` for user state; `NotificationContext` for unread count.
- **Infinite scroll** — `useInfiniteScroll` hook with IntersectionObserver; triggers cursor-paginated fetch.
- **Debounced search/input** — tag input in link form: 300ms debounce with a custom `useDebounce` hook.
- **Optimistic UI** — vote buttons update count instantly; revert on API error.
- **Code splitting** — `next/dynamic` for heavy components like `Slider`.
- **Error boundaries** — class component wrapping feed and comment sections.
- **Pure CSS animations** — all micro-interactions use `transition` and `@keyframes` (no JS animation libs).
- **Notification polling** — `useNotifications` polls `/api/notifications` every 30s, pauses when tab is hidden (`document.visibilityState`).

---

## 12. Performance & Free Tier Optimizations

- **DB pool:** `max: 5` connections in `lib/db.ts` (Neon free tier limit).
- **Indexes:** All indexes defined in `init.sql` — never query without them.
- **EXPLAIN ANALYZE:** Run on any slow query before shipping.
- **Next.js image optimization:** Use `<Image>` from `next/image` for avatars and previews.
- **Lazy routes:** `next/dynamic` with `ssr: false` for client-heavy components.
- **Rate limiting:** `middleware.ts` tracks requests per IP using an in-memory map; return 429 if > 60 req/min.
- **Tab-aware polling:** Pause all polling when `document.visibilityState === 'hidden'`.
- **Compression:** Next.js enables gzip by default on Vercel.

---

## 13. Environment Variables & Deployment

### `.env.local`

```
DATABASE_URL=postgresql://user:pass@host:5432/glinqx
JWT_SECRET=your_super_secret_jwt_key_32_chars_min
CRON_SECRET=shared_secret_for_cron_endpoints
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Deployment checklist

1. Push to GitHub.
2. Create PostgreSQL database on [Neon.tech](https://neon.tech) (free). Run `init.sql`.
3. Import project to [Vercel](https://vercel.com), set all env vars above.
4. Deploy. Vercel auto-builds Next.js.
5. Set up cron jobs on [cron-job.org](https://cron-job.org):
   - Streaks: `POST https://yourdomain.com/api/cron/streaks?secret=CRON_SECRET` — daily 00:00
   - Digest: `POST https://yourdomain.com/api/cron/daily-digest?secret=CRON_SECRET` — daily 09:00

---

## 14. System Design Diagram

```mermaid
graph TB
    Client[Browser Client] -->|HTTP Requests + Cookie| Next[Next.js App Router]
    Next -->|Route Handlers| API[API Layer]
    API -->|Raw SQL via pg| PG[(PostgreSQL / Neon.tech)]
    API -->|cheerio + node-fetch| Scraper[Link Parser]
    API -->|nodemailer| SMTP[Gmail SMTP]
    Next -->|Serves RSC + CSR| Pages[Frontend Pages]
    Pages -->|Poll /api/notifications every 30s| API
    Cron[cron-job.org] -->|POST with CRON_SECRET| API
    Client -->|GET /s/:code| API
    API -->|302 Redirect| ExternalURL[External URL]
```

---

## 15. Final Checklist Before Launch

### Auth
- [ ] Email register + login works; JWT cookie is `httpOnly`
- [ ] Google OAuth works; same-email accounts are merged
- [ ] Logout clears cookie; protected routes return 401 without cookie
- [ ] Banned users cannot log in

### Links
- [ ] Create link auto-scrapes preview (title, image, description)
- [ ] Short code generated on every link; redirect works via `/s/:code`
- [ ] Upvote/downvote updates counts + poster karma
- [ ] Private links only visible to allowed users
- [ ] Anonymous links show "Anonymous" not username
- [ ] Daily Dose returns top 5 of last 24h
- [ ] Random link endpoint returns a random public link
- [ ] Flagged links appear in admin panel

### Comments
- [ ] Infinite nested comments display correctly at all depths
- [ ] Reply button opens inline form
- [ ] Soft-deleted comment shows `[deleted]`, children still visible
- [ ] Comment upvote works; count updates
- [ ] `comment_count` on link updates correctly

### Users
- [ ] Profile page shows bio, karma, streak, badge, links
- [ ] Follow/unfollow updates feed
- [ ] Block hides that user's content from feed

### Discovery
- [ ] Leaderboard shows correct users for week/month/all
- [ ] Recommendations pull from user interests
- [ ] Notification bell shows unread count; marks as read on click
- [ ] Tags page shows links for that tag

### Tools
- [ ] Shortener creates short link; copy button works
- [ ] Parser returns metadata (title, image, description) for any URL

### Gamification & Admin
- [ ] Streaks increment daily if user posts; reset if they skip a day
- [ ] Badges appear on profile at correct karma thresholds
- [ ] Admin can delete flagged links and ban users

### Technical
- [ ] `npm run build` passes with zero errors
- [ ] Responsive design checked at 320px, 768px, 1024px
- [ ] PWA installable on Android/iOS
- [ ] No console errors in production
- [ ] Environment variables set on Vercel
- [ ] Cron jobs configured on cron-job.org
- [ ] All DB indexes present (`\d links` in psql)

---

*Built with Next.js 14 · TypeScript · Pure CSS · PostgreSQL · Deployed on Vercel (free tier)*
