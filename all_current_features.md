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

## Links
- **Create** — submit single URL with auto-fetched OG metadata (title, description, image), manual tag input, anonymous posting
- **Navigation guard** — unsaved data detection on `/submit` with `ConfirmModal` on browser refresh or internal link click
- **Visibility** — three levels: `public` (everyone), `followers` (only followers of author), `private` (only author)
- **Visibility badge** — emoji indicator (🌐/👥/🔒) on all link cards
- **Edit menu** — three-dot dropdown on own link cards to change visibility (PATCH via API)
- **Feed** — tabbed (following / explore / for you), visibility-aware filtering
- **Sorting** — Newest, Oldest, Most Likes via reusable `SortDropdown`
- **Daily Dose** — curated discovery feed
- **Random / Internet Roulette** — auto-play with 10s cooldown
- **Search** — home page search, explore pre-fetching
- **Short URLs** — `lnkzoo.vercel.app/s/[code]` with custom shortener tool
- **Flagging** — report inappropriate links

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
- Metric cards (users, links, comments, likes, flagged, banned)
- Sparklines, trend charts, dual trend charts, donut chart (role distribution), horizontal bar chart (top tags)
- Flagged links panel with quick actions
- **User management** — table with role selector (`user`/`prouser`/`admin`), ban/unban toggle, pagination

## Tag System
- Tags explore page at `/tags/[tag]`
- Auto-suggested tags via Groq API during link creation
- Bulk add/remove tags in manage dashboard
- Tag usage count tracking

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
- **Lib** — `lib/` (db, auth, shortCode, api-utils, rate-limit, logger)

## Security
- JWT-based auth with 30-day expiry
- Role-based access control (admin middleware)
- Rate limiting on API routes
- Input validation (password max 128 chars, open redirect check)
- Consistent error responses (no stack traces leaked)
- API route ownership guards (delete/update only own resources)
