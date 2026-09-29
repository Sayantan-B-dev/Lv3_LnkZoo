# Access & security policies

Who can see and do what, across the whole app. `lib/policies.ts` is the executable
half of this document; if a rule here changes, the code changes with it.

## Layers

Every request passes up to three independent checks, each assuming the one below it ran:

| Layer | Where | Answers |
|---|---|---|
| 1. Page guard | `proxy.ts` | "May this browser open this page?" — redirects to `/login` |
| 2. Route guard | `lib/policies.ts` (`requireSession` / `requireAdmin`) | "May this caller call this endpoint?" — 401 / 403 |
| 3. Row policy | `services/*`, inside the SQL | "May this caller touch this row?" — empty result / 404 |

Layer 3 is the one that actually protects data. A route guard only says "you may
call this", never "you may touch this row", so anything scoped to a user repeats
the predicate **inside the statement** (`... AND user_id = $me`, or the feedback
`visibilityCondition()`). A guessed id can never reach a row the caller does not
own — it just 404s.

Middleware does not run for every request shape, so layer 2 never trusts layer 1.

## Page access (`proxy.ts` + `config.matcher`)

| Path | Guest | Signed in | Admin |
|---|---|---|---|
| `/feedback` | ✅ public board | ✅ | ✅ |
| `/`, `/tools`, `/explore`, `/link/*`, … | ✅ | ✅ | ✅ |
| `/submit`, `/profile/*`, `/notifications` | → `/login` | ✅ | ✅ |
| `/admin/*` | → `/login` | → `/admin/forbidden` | ✅ |

The matcher in `proxy.ts` must list every protected path; a path missing from it
never reaches the guard at all. The path lists themselves live in
`lib/policies.ts` (`PROTECTED_PATHS`, `ADMIN_ONLY_PATHS`).

## API access

**Sessions.** Signed JWT (HS256, 30 days) in an httpOnly cookie, with a
`Bearer` header fallback. The role is read from the signed payload — never from
a header, query param, or body field the caller controls.

| Rule | Where |
|---|---|
| Route guards: `requireSession()` / `requireAdmin()` | `lib/policies.ts` |
| Ownership test for "edit or delete your own thing": `canManage()` | `lib/policies.ts` |
| Client address for IP-keyed limits: `clientIp()` | `lib/policies.ts` |
| Cookie flags (httpOnly, `sameSite=lax`, secure on https) | `lib/auth.ts` `cookieOptions()` |

**Endpoints and who may call them.**

| Endpoint | Guest | Signed in | Admin | Notes |
|---|---|---|---|---|
| `GET /api/feedback` | ✅ | ✅ | ✅ | Rows filtered by visibility (below) |
| `POST /api/feedback` | 401 | ✅ | ✅ | Multipart, server-validated |
| `PATCH /api/feedback/[id]` | 403 | 403 | ✅ | Status triage |
| `DELETE /api/feedback/[id]` | 401 | own only | ✅ | Ownership inside the `DELETE` |
| `GET /api/tools/items` · `DELETE /api/tools/items/*` | 401 | ✅ own only | — | Ownership inside every statement |
| `POST /api/tools/parse` | ✅ | ✅ | ✅ | Rate limited 20/min/IP; SSRF-checked |
| `POST /api/upload` | 401 | ✅ | ✅ | Folder allowlist, 5MB cap, data-URI only |
| `POST /api/links`, `/api/links/bulk` | 401 | ✅ | ✅ | |
| `/api/admin/*` | 401 | 403 | ✅ | Role from the JWT |
| `POST /api/cron/*` | — | — | — | Scheduler-only; must stay unlisted (see TODO) |

## Row-level policies

**Feedback.** Public board; the author picks `public` (default) or `private` per
report. Enforced by `visibilityCondition()` in `services/feedback.service.ts`:

| Viewer | Predicate |
|---|---|
| Admin | *(none — sees everything)* |
| Signed in | `(visibility = 'public' OR user_id = $me)` |
| Signed out | `visibility = 'public'` |

The `status` / `visibility` query filters are **appended** to that predicate, so
they can only narrow the caller's allowed set, never widen it. The per-status
`counts` tally reuses the same three branches, so a chip counter cannot reveal
that a private report exists.

**Tool output** (`temp_files`, `shared_texts`, `shortened_links`). Ownership
lives in the statement: listing is `WHERE user_id = $me`, destroying is
`DELETE ... WHERE code = $code AND user_id = $me`. Guests write `user_id NULL`
and are simply never listed; a short link can be *claimed* by its creator
(`UPDATE ... WHERE user_id IS NULL`) but never reassigned.

**Links.** Visibility `public` / `followers` / `private`; the feed query filters
by it, and edit/delete routes are owner-or-admin with the ownership repeated in
the SQL.

## Abuse limits

In-memory limiter (`lib/rate-limit.ts`) — per instance, resets on deploy. Good
enough for one Node process; move to Redis if we ever scale horizontally.

| Bucket | Limit |
|---|---|
| `feedback:ip:<ip>` | 10 posts / 10 min |
| `feedback:user:<id>` | 5 posts / 10 min |
| `feedback:list:<id>` / `feedback:list:ip:<ip>` | 60 reads / min |
| `feedback:patch` / `feedback:delete` | 20 / min per user |
| `tools:parse:ip:<ip>` | 20 / min |
| `upload:<id>` | 20 / 10 min |
| `toolitem:destroy:<id>` | 30 / min |
| Shorten / share-text | per-IP DB-backed windows (`temp_file_limits`, `shared_text_limits`) |

Mutation routes cap the request **before** reading the body (`content-length`
→ 413) so a giant upload never sits in memory.

## Response headers (`next.config.js`)

Every route sends: a `Content-Security-Policy` (external origins pinned to the
two Google Fonts hosts; inline scripts still allowed for the theme bootstrap and
Next hydration — closing that means nonces via middleware), HSTS (ignored on
http/localhost), `Permissions-Policy` denying camera/mic/geo/payment/usb,
`X-Frame-Options: DENY`, `nosniff` and `Referrer-Policy`.
`X-XSS-Protection` is deliberately absent — deprecated and ignored everywhere.

Dev adds `'unsafe-eval'` (React refresh) and `ws:` (HMR) to the CSP; prod does
not.

## Input & content rules

- Parameterized queries only — `sql` tagged templates or `query(text, $n)`.
  No string-built SQL anywhere.
- Every route wraps in `apiHandler`; failures return `{ error }` with a
  `requestId`, never a stack trace or driver message.
- Uploads: MIME allowlist, size cap, and **SVG is always excluded** — it can
  carry `<script>`.
- `/api/upload` accepts a `data:` URI only, into an allowlisted folder. A remote
  URL would make the server fetch whatever the caller names.
- Anything that fetches a user-supplied URL goes through `fetchRemote()`
  (`lib/urlSafety.ts`): scheme allowlist, credentials rejected, loopback /
  private / link-local / metadata IPs and `.internal`-style hosts blocked, and
  the check re-applied to **every redirect hop**. Known limits: it is a
  name-based guard, not DNS-rebinding-proof, and it cannot see through DNS to
  catch a hostname resolving to a private address at request time.

## Database row-level security

`database/migrate_rls_user_tables.sql` enables RLS on `feedback`, `temp_files`,
`shared_texts` and `shortened_links`, with policies that mirror the rules above
(via `app.current_user_id()` / `app.is_admin()` session helpers).

It is a safety net, **not** a second enforcement point: the server role owns the
tables and bypasses RLS, by design — the app reads anonymously and keeps its
authorization in the JWT. Any other role granted table access inherits these
row rules instead. Do **not** add `FORCE ROW LEVEL SECURITY` without also
setting `app.current_user_id` / `app.current_role_setting` per transaction —
forced RLS with the variables unset makes every query silently return zero rows.

## Known gaps / TODO

- `/api/cron/*` routes have no shared secret — anyone can trigger cleanup or
  the digest. Add a `CRON_SECRET` bearer check.
- The limiter is per-process; horizontal scaling needs a shared store.
- `linkParser.service.ts` resolves hostnames through the OS resolver, so DNS
  rebinding is out of scope for the current name-based guard.
- The CSP still allows inline scripts (theme bootstrap, Next hydration);
  closing it means nonce-per-request through middleware.
- Only the four user-owned tables carry RLS policies; `links` visibility is
  still API-only.
