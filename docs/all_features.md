# All features by date

Every feature LnkZoo has shipped, in chronological order (newest first), derived
from the git history. The hash in parentheses is the main commit; fixes are
folded into the feature they belong to unless they stand alone. For the
thematic view — what the app does today, grouped by area — see
`all_current_features.md`; for access rules, `policies.md`.

## 2026-09-30 — Topic-tinted card borders

- Every link card's border takes a dim mix of its topic's colour from the seeded `topics.color` palette (AI & Data violet, Web & Cloud blue, Science & Math green, …), brightening toward the text colour on hover; cards without a topic stay neutral grey. Driven by one `--topic-color` custom property on the card root; the link-detail card and the topic badge share it. Six card-feeding APIs that dropped the colour (random, daily-dose, bookmarks, profile links, tag links, recommendations) gained `topic` / `topic_name` / `topic_color` (1ee56d1)
- Follow-up fix: the main feeds (home, explore, topics, tags, bookmarks, categories, websites, profile) render through `ScatteredLinks`, not the shared `LinkCard`, so they had stayed grey — it now sets the same variable. The floating hover-preview popup (image + stats card after 400ms hover) was removed along with its timer, tracking and ~90 lines of CSS (8d671c4)

## 2026-09-30 — Policy hardening

- SSRF guard for server-side URL fetches (`lib/urlSafety.ts`): scheme, credential, loopback/private/metadata host checks, re-applied on **every redirect hop**; wired into the OG parser used by submit and bulk upload (79ef32a)
- `/api/upload` lockdown: data-URI only (PNG/JPEG/WebP), 5MB cap enforced before the body is read, Cloudinary folder allowlist, per-user rate limit (79ef32a)
- Centralized access policy in `lib/policies.ts`: `requireSession` / `requireAdmin` route guards, shared protected-path lists for the page guard, owner-or-admin helper (fea37e2)
- `docs/policies.md`: the full access + security matrix — three enforcement layers, endpoint table, abuse limits, known gaps (2b8c041)
- Security headers on every route: Content-Security-Policy (external origins pinned to Google Fonts), HSTS, Permissions-Policy; deprecated `X-XSS-Protection` dropped (6840733)
- Privacy / Terms / Cookies pages rewritten to describe actual behaviour: feedback visibility, tool expiry, real processors, the single session cookie (49137a1)
- Row-level security on `feedback`, `temp_files`, `shared_texts`, `shortened_links` — defense in depth mirroring the app policies; the app role still bypasses it as table owner, by design (6bf3c51, b1a5d2f)

## 2026-09-29 — Feedback board + tool ownership

- Feedback becomes a **public board**: anyone reads, each report is public or private by author choice, enforced in SQL so filters can only narrow (2402a46, ebe39a7)
- Admin quick-manage panel for feedback on the dashboard: inline status select, screenshot link, visibility badge, delete, live counts (9885eaa, 52ec8ac)
- Feedback inbox ships: signed-in reports with screenshot, six-status triage, IP+user rate limits, SVG excluded (670c0c5)
- Profile **Tool Links**: list and destroy your own short links / transferred files / shared texts, with live countdowns; guests stay untracked (dbfcd68)
- File Transfer expiry picker: 5 min / 1 hour / 24 hours, validated server-side, persisted across refresh (1e44847)
- Hero shows all tools as a 2×2 card grid, replacing the marquee pill (7b9d30a)
- fix: turbopack root pinned to the project, ending RSC-manifest 500s on every route (322e270)

## 2026-08-20

- Tool countdowns anchored to server time — immune to client clock skew (b1c554c)

## 2026-08-10

- Text Share tool: self-destructing text sharing with chosen lifetime (c98738e)
- Tool results persist across refresh, with per-tool reset buttons (808aa42)
- Hero tools marquee pill, working theme-toggle icon (moon/sun swap), mobile-tuned particles (da375f8) — marquee later replaced by the hero grid
- All documentation consolidated into `docs/`, plus per-feature DB query docs (e92afb6, 569fc2a)

## 2026-08-03

- Low Weight File Transfer: self-destructing file sharing with blocked-extension list (54ebe9a)
- Downloadable QR codes under generated short URLs (56cf613)
- Tools promoted in the "Why LnkZoo" section; tool renamed and mobile layout hardened (6b8a89c, a4e7a9b)

## 2026-08-02

- Bookmark toggle on link cards everywhere (3a1c2d6)
- Prev/next navigation on the link detail page, kept visible on mobile (83361e8, 85bd659)
- Particle fly-through effect on link detail; cursor spins during any in-flight activity (11e89c4, 90b5ff3)

## 2026-07-29

- OG parse speed-up, AI button dark-mode visibility, production error toast (a50051a)

## 2026-07-28 — AI generation + Website topic

- AI Generate modal: fills title/description/tags from a pasted draft (4000-char source), pro/admin only (f00666a, 1e0158c, a7a665e)
- Amazing Websites moves to `/websites` with full explore-style filters — search, sort, category (2365ad3)
- Website topic (id=101) inserted under Web & Cloud via migration script (10ee704)
- Editable username, responsive profile layout, topic filter (fdf5fee)
- fix: local sql driver learns nested fragments; card overflow + title ellipsis (f1f498e, 8d716e0)

## 2026-07-25

- Footer personal social links + copyright (a8a7415)

## 2026-07-22 — Parser + engagement hardening

- Uniform text limits (title 150, description 500, tags 8) across API and frontend (8c845ce)
- Copy-link button on cards and detail page; submit redirects to the link page (1bd4ce3)
- OG parser fixes: version-less User-Agent (Facebook was blocking), relative `og:image` resolution, `og:image:secure_url` fallback, broken previews hidden (0488fdd, 2995600, 9d74b31)
- Bulk upload hardening: per-domain concurrency, 45s time budget, short-code retry, batched progress events (c8e2247)
- Optimistic like/bookmark with a faster like API (5911c0a)

## 2026-07-21 — Topics taxonomy + analytics v2

- Curated **topic taxonomy**: self-referencing `topics` table + `links.topic_id`, grouped submit dropdown, topic badges, topics hub + per-topic pages, explore topic-type filter, admin topics tree manager (ec9ccfc → ebbbe67)
- Admin analytics v2: range selector (7/30/90/all), gap-filled series, new KPIs, PieChart / StatTable / BucketBar / ChartEmpty (740dc73, 880db24, 0d8fcdb, 3e8c0d5)
- Analytics event tracking: `saved_links`, `link_view_events`, `link_click_events`, `daily_activity` (1343dc8)
- 7-tab tutorial section on the home page (d133c30)
- `topic_id`, title, description become required end-to-end (7869f6d)
- Short links gain 24h expiry, a cleanup cron, and a rate-limited shorten API (9781f29)
- Themed topic dropdown, app typography unified (e97320d)

## 2026-07-20

- Auth session persists across dev-server restarts; card nav loader; unified search cards (a539aab)

## 2026-07-18

- Dark theme becomes the default (70b11b0)
- ScatteredLinks layout replaces inline link grids app-wide; LineSidebar dropped (39d4bb2)
- Profile category filter — shows only domains the user has posted in (4b94648)
- Particles on link detail, made theme-aware (a32180b, 9eb2807)
- Responsive CSS fixes across five files; sidebar sections hidden for guests (7803dc1, 7a44350)

## 2026-06-17

- Licence file added (1d64292)

## 2026-06-09 — Notifications polish

- Notification selection + bulk mark read/unread with animated checkboxes (dc0a33d)
- Notification panel CSS, SVG empty state, no premature redirect on refresh (cb12cb9, bfa08af, 04b9875)
- Overflow fixes on link detail and the mobile topbar (b14140c)

## 2026-06-07 — Parser fallbacks + deploy readiness

- Duplicate link detection and short link resolution (7149545)
- Platform metadata fallbacks: oEmbed, JSON-LD, `ytInitialPlayerResponse` (7149545)
- Categories, pagination, HTML entity decoding in titles/descriptions (faf8ec3)
- Nested short links prevented (76ab668)
- "react-doctor" pass: html lang, memoized contexts, `Promise.all`, array keys, Suspense, URL parser (83a1306)

## 2026-06-06 — Platform upgrade + bulk upload

- Next.js 14.2.3 → 16, React 18 → 19, ESLint 8 → 9 (4907c8e)
- Link visibility control: public / followers / private, with badges (7399790)
- User link management dashboard `/manage/links`: stats, bulk delete/visibility/tagging, pagination (56fe52e)
- Bulk upload: streaming progress bar, AI auto-tagging with fallback, `.txt` report download (f5a7be3, 6059b5b)
- Eight small-engineering features + session/perf fixes (324ae50)
- Navigation guard on `/submit`; OG parser extracted to a service; Groq replaces Cerebras for tag suggestions (b269805)
- Rebrand: Glinqx → Linkzoo → LnkZoo (46e5107, d63df7f)
- SEO: sitemap, robots, metadata; Google OAuth CSRF state fix; eslint flat config (135cab1)
- Floating sign-in prompt; mobile footer with expand/collapse (c5bd043, 3e92bea, 85dbc80)

## 2026-06-05 — Legal + mobile

- Privacy, Terms and Cookies pages with footer links (3ecc672)
- Footer moves to global layout; full mobile layout overhaul (b97aeaa, f151a0a, 7a1a11c)
- Google OAuth duplicate-email fix; seed aligned with init schema (ad0dfbb)

## 2026-06-04 — Admin + community core

- Admin dashboard, role system (`user`/`prouser`/`admin`), theme persistence via localStorage (4b2c53d, 418088e)
- Bulk upload v1: 5-thread concurrent processing (3dc4c11)
- Users directory page; leaderboard rows become clickable (38858b6)
- Custom toast system with transparent blur (46e7714)
- Sort dropdown (newest / oldest / most likes) on home, explore and profile (0a27296)
- Comment nesting fixed: depth limit, self-reply prevention (a8a6607)
- Comprehensive error handling and security hardening (3c3d714)
- Loading globe animation; preview images on all LinkCard variants; home page modularized into components with split CSS (0ea1e97, cf26b39, a36a7ff, e58429d)

## 2026-06-03 — Structure + identity

- Pages moved into the `(main)` route group (591dcd5)
- Custom cursor, full setup (3bd92ad)
- Like-based leaderboard; upvote/downvote idea rejected and stripped from cards (47da0ec, be1c822)
- `LinkCard` component extracted; CSS modularized out of TSX (1a10066, 0839520, b9616f6)
- Light theme is the default at this point (e90159b) — reversed on 07-18

## 2026-04-29 — Initial build

- Backend complete: APIs, lib, middleware, seed data (ed90eeb)
- Frontend complete: layout, contexts, home feed, explore, leaderboard, submit, profile, login, not-found (d837f7c, 733f0fb, e8d3ad1, f57ab07)
- Tags explore page; voting, user-specific leaderboard ranking, profile popups with verified badges (77cd198, def6dfb)
- Home search + explore pre-fetching; emoji migrated to SVG (a880159)
- Internet Roulette auto-play discovery with 10s cooldown (ec46dce)
- Background physics overhauled: auto-refilling interactive particle grid (5453480)
- Profile image cropping, cover backgrounds, glassmorphism polish (cd36970)
- README (0fb45ea)

---

*Derived from `git log --date=short` (168 commits, 2026-04-29 → 2026-09-30).
Superseded work is noted inline (hero marquee → grid; light → dark default;
feed hover-preview popup removed).
Never-shipped experiments are not listed.*
