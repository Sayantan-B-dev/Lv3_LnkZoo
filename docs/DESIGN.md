# DESIGN — Component & Route Map

"Where's what" index to save tokens/context. Pair with `STYLE.md` (CSS) and `AGENT.md` (rules).

## Aesthetic
Monospace dev/terminal look (JetBrains Mono), dark-first, restrained accent, subtle borders over shadows. Interactions are quiet (`var(--t)` transitions). Every data page follows loading → error → empty → content states (see AGENT.md).

## App routes — `app/`
Route groups: `(main)` = public/user shell (sidebar+topbar), `admin` = admin shell, top-level = auth + redirects.
- Root: `layout.tsx` (imports globals + providers) · `loading.tsx` · `not-found.tsx`.
- Auth: `login/`, `register/`.
- Short-link resolver: `s/[code]/`.
- **(main)** user app: `page.tsx` (home) · `explore/` · `topics/` + `topics/[topic]/` · `tags/` + `tags/[tag]/` · `categories/` + `categories/[category]/` · `link/[id]/` · `submit/` + `submit/bulk/` · `manage/links/` · `profile/` + `profile/[username]/` · `bookmarks/` · `daily-dose/` · `random/` · `leaderboard/` · `users/` · `notifications/` · `settings/` · `tools/` · `guest-pool/` (public read-only listing of guest-created tool output, ungated in `proxy.ts`) · `index/` (the manual: every route vs guest/signed-in/admin, ungated) · `feedback/` (public report board, ungated in `proxy.ts`; see `feedback.md`) · legal (`privacy`,`terms`,`cookies`).
- Home is composed of `app/(main)/home-components/*` (Hero, HeroTools, About, Features, HowItWorks, Metrics, Feed, FAQ, Tutorial, CTA, Marquee, Reveal, CounterStat, icons). Hero now embeds `HeroTools` — a 2×2 grid of all four tool cards (URL Shortener, File Transfer, Text Share → `/tools#<anchor>`; Meta Scraper marked "Soon") — plus a `.hero-manual` pill that sends first-time visitors to `/index`. HowItWorks explains category/topic/tag distinction. Tutorial is a 7-tab platform-wide step-by-step guide.
- **admin**: `layout.tsx` (shell + `navLinks` array — add nav entries here) · `dashboard/` · `users/` · `topics/` · `forbidden/`. Admin charts: `app/admin/components/*` (MetricCard, Sparkline, TrendChart, DualTrendChart, DonutChart, PieChart, HorizBarChart, BucketBar, StatTable, FlaggedPanel, FeedbackPanel, GuestPoolPanel, RangeSelector, ChartEmpty). Dashboard is sectioned + range-driven: `/api/admin/stats?range=7|30|90|all` returns gap-filled series; charts show `ChartEmpty` when no data.

## Shared components — `components/`
- **common/**: `Navbar`, `Sidebar` (nav sections come from `lib/navRoutes.ts`; icons live here keyed by `id`; hovering a route shows a JS-positioned `.nav-tip` bubble with the route's `hint`), `Topbar`, `Footer`, `ToastContainer`, `ConfirmModal`, `LoadingSpinner`, `LoadingGlobe`, `ErrorMessage`, `SignInPrompt`, `PasswordInput`, `SortDropdown`, `TopicSelect` (searchable grouped topic picker), `NotificationBell`, `NotificationPanel`, `CustomCursor`, `AnimatedBg`.
- **profile/**: `ToolItems` — "Tool Links" section on your own profile listing active short links / temp files / shared texts with a countdown and Destroy button.
- **tools/**: `ToolItemRow` — the shared row for one tool output (icon, live countdown, link, type extra) plus the `ToolItem` type, `stripOrigin` and the `toolItem*` helpers. Used by `profile/ToolItems` and `guest-pool/page.tsx`; pass `onDestroy` for an owner row, omit it for the read-only guest pool. `app/admin/components/GuestPoolPanel.tsx` reuses the type/helpers for its moderation table.
- **links/**: `LinkCard` (4 variants; `renderTopic()` badge), `LinkForm`, `LinkPreview`, `TagBadge`.
- **manage/**: `LinkTable`, `BulkActionBar`, `BulkTagModal`, `Pagination`, `StatsCards`.
- **comments/**: `CommentThread`, `CommentItem`, `CommentForm`.
- **recommendations/**: `Slider`.
- **react-bits/**: `Particles`, `ScatteredLinks` (each ships its own `.css`).

## Context providers — `context/`
`AuthContext` · `ToastContext` (`useToast().addToast(msg, 'success'|'error'|'info')`) · `NotificationContext` · `UIContext` · `MobileMenuContext` · `LoadingContext` · `ThemeContext` (`useTheme().theme`, `toggleTheme()`; syncs to `data-theme` via MutationObserver). All consumed via `useX()` hooks.

## Navigation data — `lib/navRoutes.ts`
One list of every route the sidebar can show (`PUBLIC_SECTIONS`, `USER_SECTIONS`, `ADMIN_SECTIONS`): `label`, `href`, `hint` (sidebar bubble + table one-liner), `about` (manual copy), `audience` (`guest` | `user` | `admin`) and the odd `guestNote` / `sidebar: false`. The sidebar and the `/index` manual both render from it, so a documented access level cannot drift from the real one. Adding a page to the nav means adding one object here plus its icon in `Sidebar.tsx`.

## Data layer
- API routes: `app/api/<resource>/route.ts` wrapped in `apiHandler` (`lib/api-utils.ts`).
- DB: `lib/db.ts` exports tagged-template `sql`. **Constraint: the local pg shim + neon driver do NOT support `sql` fragment composition** (nesting `sql\`...\`` fragments). Write per-branch full queries, not composed `whereFrag`/`joinFrag`.
- Migrations: `database/*.sql` (dir is gitignored — force-add). Apply via `node _dbmigrate.js local|neon` or `node scripts/run-sql.js <local|neon> <file>`.
- Short links (`shortened_links` table): auto-expire after 24h; cleanup runs on shorten-API call + dedicated cron `GET /api/cron/cleanup-short-links`. Rate-limited: 10/min anonymous, 30/min logged-in.
- Tool ownership: `GET /api/tools/items` + `DELETE /api/tools/items/[type]/[code]` (`services/toolItems.service.ts`) list and destroy the caller's own tool output; requires `database/migrate_tool_items_user.sql` (`temp_files.user_id`, `shared_texts.user_id`; `shortened_links.user_id` already existed). **Guest pool**: `GET /api/tools/guest-pool` (public, read-only, 60/min/IP) returns the same shape for `user_id IS NULL` rows only — `listGuestToolItems()` is the mirror of `listToolItems()`, paginated with `hasMore`. There is no owner-facing destroy path; only the admin routes (`GET/DELETE /api/admin/guest-pool/*`, `requireAdmin`) can remove a pool row, and `destroyGuestToolItem()` repeats `user_id IS NULL` so it can never touch an owned item.
- Feedback (`feedback` table, `services/feedback.service.ts`): a public report board. Anyone reads public reports; each report is public or private as chosen by its author; admins see everything, set a status, and triage from `app/admin/components/FeedbackPanel.tsx`. Requires `database/migrate_feedback.sql` and `database/migrate_feedback_visibility.sql`. Details in `feedback.md`.
- Analytics tables: `link_view_events`, `link_click_events`, `daily_activity`, `saved_links` — fire-and-forget inserts for dashboard charts.

## Feature: Topics taxonomy (reference example)
Self-referencing `topics` table: top-level rows = **topic-types** (groupings, not link-bonded); children = **subtopics** (link-bonded via `links.topic_id`, single per link). Admin-owned; users pick from dropdown; all lists alpha-sorted.
- Admin CRUD: `app/admin/topics/page.tsx` + `app/api/admin/topics/route.ts` + `/[id]/route.ts`.
- Public: `app/api/links/topics/route.ts` (tree+counts), `/topics` hub, `/topics/[topic]`.
- UI: `components/common/TopicSelect.tsx`, badge in `LinkCard` + link detail.

## Adding a feature — checklist
1. Route/page under `app/(main)|admin/`. 2. Component in `components/<domain>/`. 3. Stylesheet `styles/pages/<route>.css`, `@import` in `globals.css` (or in-route). 4. Nav entry: one object in `lib/navRoutes.ts` + its icon in `components/common/Sidebar.tsx` (user) or `app/admin/layout.tsx` `navLinks` (admin) — the `/index` manual picks it up automatically. 5. API in `app/api/` via `apiHandler`. 6. `npx tsc --noEmit` + `npm run lint`.
