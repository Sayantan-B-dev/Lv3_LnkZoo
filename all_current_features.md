# All Current Features

## Core Infrastructure
- **Next.js 16 + React 19** — upgraded from 14.2.3 / React 18 (ESLint 8 → 9)
- **PostgreSQL** via `@neondatabase/serverless` (production) / `pg` Pool (local dev)
- **JWT auth** — 30-day sessions, cookie + Bearer header support
- **Unified error handling** — `apiHandler` wrapper on all 40+ routes, consistent `{ error, requestId }` responses
- **Rate limiter** — in-memory key-based with auto-cleanup
- **Structured logger** — info/warn/error with ISO timestamps
- **Health check** — `GET /api/health` pings DB (200/503)

## Authentication
- Email/password registration & login
- Google OAuth sign-in
- Session middleware (cookie or Bearer token)
- Role system: `user` / `prouser` / `admin`
- Floating sign-in prompt (unauthenticated users)
- Logout from sidebar
- Home link on login/register pages for unauthenticated users
- **Persistent session** — auth survives dev-server restarts (stable JWT secret handling)

## Links
- **Create** — submit single URL with auto-fetched OG metadata (title, description, image), manual tag input, anonymous posting. **Required**: topic, title, description — validated client + server.
- **Navigation guard** — unsaved data detection on `/submit` with `ConfirmModal` on browser refresh or internal link click
- **Visibility** — three levels: `public` (everyone), `followers` (only followers of author), `private` (only author)
- **Visibility badge** — emoji indicator (🌐/👥/🔒) on all link cards
- **Edit menu** — three-dot dropdown on own link cards to change visibility (PATCH via API)
- **Feed** — tabbed (following / explore / for you), visibility-aware filtering
- **Sorting** — Newest, Oldest, Most Likes via reusable `SortDropdown`
- **Daily Dose** — curated discovery feed
- **Random / Internet Roulette** — auto-play with 10s cooldown
- **Search** — home page search, explore pre-fetching
- **Short URLs** — `lnkzoo.vercel.app/s/[code]` with custom shortener tool; auto-expire after 24h; rate-limited 10/min guests, 30/min users
- **Flagging** — report inappropriate links
- **Topic assignment** — grouped topic dropdown on submit form; `topic_id` stored per link
- **Topic badge** — themed topic pill on link cards and detail page
- **Card navigation loader** — loading indicator when opening a link card
- **View & click tracking** — every link view (`link_view_events`) and short-link click (`link_click_events`) recorded for analytics

## Bulk Upload
- **Concurrent processing** — 5-thread parallel OG parsing & link creation
- **Streaming progress** — real-time NDJSON via `ReadableStream` with progress bar
- **Auto-tagging** — AI tag suggestions via Groq (`llama-3.3-70b-versatile`) with graceful fallback (silently continues if AI fails)
- **Admin override** — unlimited URLs for admins, max 10 for regular users
- **Visibility selector** — applies to all URLs in batch
- **Report download** — `.txt` report with timestamp, summary, per-URL results

## User Dashboard (`/manage/links`)
- **Stats cards** — total, public, followers-only, private counts; likes, views, comments, clicks
- **Link table** — searchable, sortable (title, likes, views, comments, created), selectable rows
- **Bulk delete** — with `ConfirmModal`
- **Bulk visibility** — segmented control (Public / Followers / Private)
- **Bulk tagging** — modal to add/remove tags on multiple links simultaneously
- **Pagination** — page controls with ellipsis

## Comments
- Full threaded nesting with depth tracking
- Recursive `CommentItem` component (depth-based indent, thread-lines, collapse/expand)
- Depth limit enforcement (max 10 levels)
- Self-reply prevention
- Inline reply forms (toggle via Reply/Cancel)
- Deleted comment placeholders (preserve thread shape)

## Likes
- Toggle like/unlike on link cards
- Like-based leaderboard (period filter: week / month / all)
- User-specific rank display

## Users
- **Profile page** — avatar with cropping, cover image, bio, website, interests, streak
- **Followers / Following** — popup lists with link counts
- **Users directory** — searchable card grid at `/users`
- **Sort by** — newest, oldest, most likes on profile submissions

## Admin Dashboard (`/admin/dashboard`)
- **Global range selector** — 7D / 30D / 90D / All; refetches every chart via `/api/admin/stats?range=`
- **Sectioned layout** — Overview → Growth → Engagement → Content → Community → Moderation
- **Overview** — 13 KPI cards (users, links, comments, likes, views, clicks, follows, bookmarks, tags, topics, short links, flagged, banned) + growth sparklines
- **Growth** — user/link growth + cumulative user/link trend charts
- **Engagement** — daily activity dual-trend, engagement-mix donut, views & clicks trends, top-links & top-contributors tables
- **Content** — topic & visibility distribution donuts, top-tags horizontal bars
- **Community** — daily-active-users / likes / bookmarks trends, user-role & notification-type donuts, streak-distribution buckets
- **Moderation** — flagged links panel with quick actions
- **Gap-filled time series** — every daily series backfills zero-count days for continuous charts
- **Empty states** — `ChartEmpty` placeholder shown when a chart has no data
- **Chart library** — d3-based MetricCard, Sparkline, TrendChart, DualTrendChart, DonutChart, PieChart, HorizBarChart, BucketBar, StatTable, RangeSelector, FlaggedPanel
- **User management** — table with role selector (`user`/`prouser`/`admin`), ban/unban toggle, pagination
- **Topics manager** — tree view to create/edit/delete curated topics (admin CRUD)

## Tag System
- Tags explore page at `/tags/[tag]`
- Auto-suggested tags via Groq API during link creation
- Bulk add/remove tags in manage dashboard
- Tag usage count tracking

## Topics (Taxonomy)
- **Curated taxonomy** — self-referencing `topics` table (parent/child groups), links reference a single `topic_id`
- **Seed data** — pre-populated curated topic set with grouped hierarchy
- **API** — public taxonomy endpoints + admin CRUD; `topic_id` support in links GET/POST
- **Submit form** — grouped topic dropdown with group separators
- **Topics hub** — `/topics` overview + per-topic page with sidebar navigation
- **Explore filter** — filter the feed by topic type
- **Link surfaces** — themed topic badge on cards and link detail page
- **Admin** — tree manager for the full taxonomy

## Home Page Sections
- **Hero** — headline, stats, CTA
- **Marquee** — trending tags carousel
- **About** — what LnkZoo is + key stats grid
- **Features** — 7 feature cards (discovery, previews, community, streaks, daily dose, short URLs, tags, analytics)
- **How It Works** — explains Categories (domain filter), Topics (60 curated), Tags (free-form, chaotic)
- **Metrics** — platform-wide stat counters
- **Feed** — tabbed link feed (following/explore/for you) with sort + search
- **FAQ** — accordion of common questions
- **Tutorial** — 7-tab step-by-step platform guide (Feed & Discovery, Posting, Managing, Discover, Short URLs & Tools, Account, Admin Panel)

## UI & Theming
- **Dark/light theme** — persisted in `localStorage` (`lnkzoo_theme`), inline `<script>` prevents FOUC
- **Background settings panel** — physics particle grid with auto-refill, interactive tuning, adjustable frequency/speed/size
- **Custom cursor** — `#fff` with `mix-blend-mode: difference` for universal invert
- **Loading globe** — 3D canvas network globe animation on page transitions
- **Toast notifications** — fixed bottom-center, backdrop blur, auto-dismiss (success/error/info)
- **Sidebar** — collapsible, grouped navigation (Feed/Discover/Create), mobile full-screen overlay with animated burger
- **Topbar** — fixed on mobile, responsive height
- **Footer** — global layout, expand/collapse on mobile
- **Mobile responsive** — all pages at 768px and 480px breakpoints
- **Unified typography** — consistent font system across the app; themed dropdowns (topic selector, sort)
- **Unified search cards** — consistent card styling across search surfaces

## Legal & Compliance
- Privacy policy, Terms of service, Cookies policy pages
- `robots.txt` — disallows `/api/`, `/admin/`, `/login`, `/register`, `/s/`
- Security headers — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- Open redirect validation on login `?from=`

## Gamification
- Streak tracking with automatic update on link creation
- Follower count and engagement metrics displayed on profiles

## Notifications
- Notification system with read/unread state
- Notification bell indicator
- Notifications API (`GET /api/notifications`)

## File Structure
- **Pages** — under `app/(main)/` route group with Topbar + NotificationPanel + `<div id="content">` pattern
- **Components** — modular `components/` (common, links, manage)
- **CSS** — organized under `styles/` (core, layout, ui, pages) with CSS variables, `color-mix()`, and `backdrop-filter`
- **Services** — `services/` (autoTag, gamification)
- **Lib** — `lib/` (db, auth, shortCode, api-utils, rate-limit, logger) — note: `lib/db.ts` local pg shim & neon do **not** support `sql` fragment composition; use full per-branch queries or the `query(text, $N)` helper
- **Reference docs** — `STYLE.md` (CSS/design tokens map), `DESIGN.md` (architecture / file map), linked from `AGENT.md`
- **Analytics tables** — `saved_links`, `link_view_events`, `link_click_events`, `daily_activity` (migration `database/migrate_analytics.sql`, applied via `scripts/run-sql.js`)

## Security
- JWT-based auth with 30-day expiry
- Role-based access control (admin middleware)
- Rate limiting on API routes
- Input validation (password max 128 chars, open redirect check)
- Consistent error responses (no stack traces leaked)
- API route ownership guards (delete/update only own resources)

## Changelog — 2026-07-20 → 2026-07-22

### 2026-07-22 — OG parser: Facebook fetching, profile links COUNT fix
- **Fix** — profile links endpoint (`GET /api/users/[username]/links`) was passing `$3`/`$4` (limit/offset) to the `COUNT(*)` query, which only uses `$1`/`$2` (and `$3`/`$4` for domain). Caused PostgreSQL prepared-statement param mismatch errors (`bind message supplies 4 parameters, but prepared statement "" requires 2`). Separated count params with contiguous numbering.
- **ScatteredLinks** — added error logging to API fetch calls for easier debugging.
- **Fix** — OG parser (`parseOGMetadata`) used a Chrome/125 User-Agent that Facebook blocks (returns 400). Switched to a version-less Chrome UA (`AppleWebKit/537.36`), which Facebook accepts and returns full OG tags. Also added `fallbackTitle()` on non-200 responses so users get a readable platform name (e.g., "Facebook Post") instead of the raw URL.

### 2026-07-20
- **Auth persistence** — session now survives dev-server restarts; added card navigation loader and unified search card styling (`a539aab`).

### 2026-07-21 — Topics taxonomy
- **DB** — curated topic taxonomy: self-referencing `topics` table + `links.topic_id`, with seed data (`ec9ccfc`).
- **API** — topic support in links GET/POST (`30be0ed`); topics taxonomy endpoints + admin CRUD (`db6fe87`).
- **Submit** — grouped topic dropdown on the post form (`279a551`).
- **Cards** — topic badge on link cards and detail page (`708ec09`).
- **Explore** — filter feed by topic type (`acd1f77`).
- **Pages** — topics hub + per-topic page + sidebar nav (`fdb2623`).
- **Fix** — restored links feed by removing unsupported `sql` fragment composition (`627b194`).
- **UI** — themed topic dropdown + unified app typography (`e97320d`).
- **Admin** — topics tree manager (`ebbbe67`); fixed invisible admin badge/buttons + topic-select group separators (`eb7ccbf`).

### 2026-07-21 — Reference docs
- Added `STYLE.md` + `DESIGN.md` reference maps, linked from `AGENT.md` (`afeefce`, `c493f28`).

### 2026-07-21 — Admin analytics overhaul
- **Phase 4** — event tracking: `saved_links`, `link_view_events`, `link_click_events`, `daily_activity` tables + view/click instrumentation (`1343dc8`).
- **Phase 0** — `ChartEmpty` empty-states across all admin charts (`0d8fcdb`).
- **Phase 1** — `/api/admin/stats` v2: `range` param (7/30/90/all), gap-filled series, new distributions & top-N aggregations (`740dc73`).
- **Phase 2** — new chart components: `PieChart`, `StatTable`, `BucketBar`, `RangeSelector` + styles (`3e8c0d5`).
- **Phase 3** — dashboard redesigned into sections with range selector, expanded 13-KPI row, and new charts (`880db24`).
- **Docs** — updated `DESIGN.md` admin components list for the redesign (`9ccadaa`).
