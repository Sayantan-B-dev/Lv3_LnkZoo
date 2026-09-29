# Feedback — `/feedback`

A **public report board**, not a discussion board. Anyone can read it; signed-in users post a title,
a description and an optional screenshot, and choose whether each report is **public** or **private**.
The maintainers set a status. There are no replies, no threads, no upvotes — deliberately.

- Page: `app/(main)/feedback/page.tsx` · styles `styles/pages/feedback.css`
- API: `app/api/feedback/route.ts` (POST + GET) · `app/api/feedback/[id]/route.ts` (PATCH + DELETE)
- Service: `services/feedback.service.ts` · rules `lib/feedbackRules.ts` · table `feedback`
- Admin triage: `app/admin/components/FeedbackPanel.tsx`, rendered on `/admin/dashboard`

## Access

| Action | Guest | Signed in | Admin |
|---|---|---|---|
| View the page | ✅ | ✅ | ✅ |
| Read the list | public reports only | public + **own** (any visibility) | **everything** |
| Post a report | ❌ 401 | ✅ | ✅ |
| Choose public/private | — | ✅ (own report) | ✅ |
| Change status | ❌ 403 | ❌ 403 | ✅ |
| Delete | ❌ 401 | own reports only | any report |

`/feedback` is deliberately **not** in `proxy.ts` `PROTECTED`, so the page renders signed-out. Posting
is gated in the API (`401`), not by a redirect, and the page shows a sign-in prompt
(`/login?from=/feedback`) in place of the composer.

### Visibility

Chosen by the author when posting (`FEEDBACK_VISIBILITIES` in `lib/feedbackRules.ts`):

| id | Who can see it |
|---|---|
| `public` (default) | everyone, signed out included |
| `private` | the author and admins only |

Visibility is enforced in SQL, never by filtering in the client. `visibilityCondition()` in
`services/feedback.service.ts` builds the predicate once and every read goes through it:

- admin → no predicate
- signed in → `(f.visibility = 'public' OR f.user_id = $me)`
- signed out → `f.visibility = 'public'`

The `status` and `visibility` query filters are **appended** to that predicate, so they can only
narrow the result — a `?visibility=private` from a guest returns their (empty) allowed set rather
than widening it. `feedbackStatusCounts(viewerId, isAdmin)` reuses the same three branches, so a
chip counter can never reveal that a private report exists.

The board only renders the visibility badge when it distinguishes something (`isAdmin || is_mine ||
visibility !== 'public'`) — a "public" pill on every card is just noise for a guest. The admin triage
table always shows it.

## Posting

`POST /api/feedback` takes **multipart FormData** (`title`, `description`, `visibility`,
`screenshot?`) so the
image is validated server-side in the same request that creates the row — there is no
client-controlled Cloudinary folder, unlike the general `POST /api/upload`.

Validation, in order:

1. `content-length` cap (`5MB + 4KB` slack) → **413** before the body is read.
2. Rate limit per IP → **429**.
3. Rate limit per user → **429**.
4. Title `3–150` chars, description `10–2000` chars → **400**.
5. `visibility` must be `public` or `private` (→ 400); omitted or empty falls back to
   `DEFAULT_FEEDBACK_VISIBILITY` (`public`).
6. Screenshot: must be a `File`, `≤ 5MB` (→ 413), and `image/png|jpeg|webp|gif` (→ 400).

**SVG is deliberately not allowed.** SVG can carry `<script>`, and an SVG served from a page is an
XSS vector. Keep it off the allowlist.

The image is uploaded to Cloudinary folder `lnkzoo_feedback` as a base64 data URI (nothing touches
disk, same approach as the temp-file tool) with `width: 1920, crop: limit`, so a 4K screenshot is
stored at a sane size.

### Rate limits (in-memory `lib/rate-limit.ts`)

| Bucket | Limit |
|---|---|
| `feedback:ip:<ip>` | 10 posts / 10 min |
| `feedback:user:<id>` | 5 posts / 10 min |
| `feedback:list:<id>` / `feedback:list:ip:<ip>` | 60 reads / min |
| `feedback:patch:<id>` / `feedback:delete:<id>` | 20 writes / min |

The double post limit is intentional: the per-user bucket stops one account flooding, the per-IP
bucket stops somebody spinning up accounts from one host.

### Why there is no SSRF surface here

Nothing in this feature fetches a URL a user supplied. The screenshot is uploaded **from** the
visitor's request, and Cloudinary does the storing — we never ask the server to go and retrieve a
remote image. That is the whole reason image-by-URL was not offered: it would have required the
`lib/urlSafety.ts` guard.

## Statuses

`lib/feedbackRules.ts` is the single source of truth; the client and server both import it.

| id | Label | Colour |
|---|---|---|
| `open` | Open | grey |
| `in_progress` | In Progress | blue |
| `priority` | On Priority | amber |
| `resolved` | Resolved | green |
| `duplicate` | Duplicate | purple |
| `ignored` | Ignored | dim grey |

Colour is driven by one CSS variable per status (`--fb-c`) set on `.fb-status-<id>`, which the badge,
the filter dot and the admin `<select>` all inherit — see `styles/pages/feedback.css`. Adding a status
means one line in the rules file and one line of CSS.

## Listing

`GET /api/feedback?status=<id>&visibility=<public|private>&page=1&limit=20`

Public — no auth required. The response carries `isAdmin`, `signedIn` and `counts` (per-status
tallies for the filter chips). `status` / `visibility` must be known ids or the request is **400**;
both only narrow the caller's allowed set. Paginated newest-first, `limit` capped at 50.

Read rate limit is bucketed by user when signed in and by IP otherwise
(`feedback:list:<id>` / `feedback:list:ip:<ip>`), so guests cannot dodge the limiter by staying
anonymous.

## Deleting

`DELETE /api/feedback/[id]` does the ownership check **inside** the `DELETE` statement
(`... AND user_id = $me` for non-admins) so a guessed id can never remove another user's row, and
returns `screenshot_public_id` so the Cloudinary asset is destroyed along with it. Otherwise every
deleted report would leak its screenshot forever.

## Setup

```bash
node scripts/run-sql.js database/migrate_feedback.sql neon
node scripts/run-sql.js database/migrate_feedback_visibility.sql neon
```

The second migration adds `feedback.visibility TEXT NOT NULL DEFAULT 'public'` plus
`idx_feedback_visibility`; existing rows are backfilled to `public` by the default.

`user_id` is `ON DELETE SET NULL` rather than `CASCADE` — a bug report is worth keeping even after
the reporter deletes their account; it just becomes unattributed ("deleted user" in the admin view).
