# Feedback — `/feedback`

A **bug-report inbox**, not a discussion board. Signed-in users post a title, a description and an
optional screenshot; the maintainers read them and set a status. There are no replies, no threads,
no upvotes — deliberately.

- Page: `app/(main)/feedback/page.tsx` · styles `styles/pages/feedback.css`
- API: `app/api/feedback/route.ts` (POST + GET) · `app/api/feedback/[id]/route.ts` (PATCH + DELETE)
- Service: `services/feedback.service.ts` · rules `lib/feedbackRules.ts` · table `feedback`

## Access

| Action | Who |
|---|---|
| View the page | Signed in only — `/feedback` is in `proxy.ts` `PROTECTED` |
| Post a report | Signed in only (API returns 401 for guests) |
| Read the list | A user sees **only their own** rows. Admins see **everyone's** |
| Change status | Admins only (403 otherwise) |
| Delete | Admin: any report. User: only their own |

Guest read access was considered and rejected: this is an internal inbox, so leaking every report to
the open internet would be backwards.

## Posting

`POST /api/feedback` takes **multipart FormData** (`title`, `description`, `screenshot?`) so the
image is validated server-side in the same request that creates the row — there is no
client-controlled Cloudinary folder, unlike the general `POST /api/upload`.

Validation, in order:

1. `content-length` cap (`5MB + 4KB` slack) → **413** before the body is read.
2. Rate limit per IP → **429**.
3. Rate limit per user → **429**.
4. Title `3–150` chars, description `10–2000` chars → **400**.
5. Screenshot: must be a `File`, `≤ 5MB` (→ 413), and `image/png|jpeg|webp|gif` (→ 400).

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
| `feedback:list:<id>` | 60 reads / min |
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

`GET /api/feedback?status=<id>&page=1&limit=20`

- Non-admin: always scoped to `user_id = $me`; a `status` filter is ignored.
- Admin: optional `status` filter, plus `counts` — a per-status tally for the filter chips.
- Paginated, newest first, `limit` capped at 50.

## Deleting

`DELETE /api/feedback/[id]` does the ownership check **inside** the `DELETE` statement
(`... AND user_id = $me` for non-admins) so a guessed id can never remove another user's row, and
returns `screenshot_public_id` so the Cloudinary asset is destroyed along with it. Otherwise every
deleted report would leak its screenshot forever.

## Setup

```bash
node scripts/run-sql.js database/migrate_feedback.sql neon
```

`user_id` is `ON DELETE SET NULL` rather than `CASCADE` — a bug report is worth keeping even after
the reporter deletes their account; it just becomes unattributed ("deleted user" in the admin view).
