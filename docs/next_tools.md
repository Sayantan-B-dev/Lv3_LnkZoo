# Next Tools — `/tools` Backlog

Candidate tools for the public Tools page (`app/(main)/tools/page.tsx`), ordered by how much new
surface each one needs. **Nothing here is implemented unless it says so.**

**Live today:** URL Shortener · Low Weight File Transfer (5 min / 1 hour / 24 hours) ·
Text Share (5 min / 1 hour / 24 hours) · Meta Scraper *(rendered as a "Coming Soon" card)*.

See `tools.md` for how the live tools work and `db/` for their tables.

---

## Adding a tool — the cheap path

The profile **Tool Links** section (`components/profile/ToolItems.tsx`) is wired generically
(`services/toolItems.service.ts`). A new *storing* tool inherits the listing, the live countdown,
the owner-scoped Destroy button and automatic expiry as soon as it:

1. **Stores an owner** — a nullable `user_id` column (follow `database/migrate_tool_items_user.sql`,
   with `ON DELETE SET NULL`) and a POST route that resolves the session via `getSessionFromRequest`.
   Guests write `NULL` and stay untracked.
2. **Adds a `UNION ALL` branch** to `listToolItems()`.
3. **Adds a `case`** to `destroyToolItem()` — including tearing down any external asset
   (the file branch shows the pattern: ownership `SELECT` first, then `destroyTempFileByCode`).

Tools that store nothing skip all three steps.

### Requirements for any server-backed tool

- Rate limit with `lib/rate-limit.ts` (`rateLimit(key, max, windowMs)`) — AGENT.md Rule 6.
- Validate input at the boundary — Rule 7 (URLs through `new URL()`, explicit max lengths).
- Return the consistent `{ error }` shape — Rule 5. Never leak internals — Rule 3.
- If it stores rows: an `expires_at`, a cleanup cron under `app/api/cron/`, and lazy prune on write.

---

## Tier 1 — the backend already exists

### 1. Meta Scraper  ← highest value, lowest effort

Paste a URL, get the title, description, OG image, domain and suggested tags — ideally with a
copyable snippet for pasting into a `<head>`.

**Why it's cheap:** the API is already written and already returns exactly this.
`POST /api/tools/parse` (`app/api/tools/parse/route.ts`) responds with
`{ title, description, image, domain, url, suggestedTags }`, backed by `parseOGMetadata()` in
`services/linkParser.service.ts` (OG/Twitter tags → `<title>` → JSON-LD → YouTube → oEmbed fallback)
and `suggestTags()` in `services/autoTag.service.ts`.

**Work:** replace the `.disabled` Meta Scraper card with a real form + result block, and reuse the
existing `.tool-card` / `.result-box` / `.result-label` classes. One file, no new API, no DB.

**Effort:** Small.

> ⚠️ **Do not ship this card without the SSRF guard below.** Today `/api/tools/parse` is only
> reachable from the submit flow. Exposing it on the public Tools page turns it into an open
> SSRF probe against your own network. The route also has **no rate limit** today.

### 2. QR Code Generator

Any text or URL → a QR code, downloadable as PNG.

**Why it's cheap:** `qrcode.react` is already a dependency, and `components/common/ShortUrlQR.tsx`
already renders a 160×160 black-on-white canvas plus a "Download QR" button
(`styles/ui/qr.css`). A standalone card is a textarea + that component.

**Work:** one card, local state only. No API route, no DB, no TTL, no cron, no rate limit —
nothing to clean up and nothing to expire.

**Effort:** Small.

### 3. Client-side text utilities

Base64 / URL encode-decode · JSON format, validate and minify · epoch ↔ ISO timestamp converter ·
UUID v4 (`crypto.randomUUID()`).

**Why it's cheap:** all of it runs in the browser. **Zero DB rows, zero rate limits, nothing to
expire** — the cheapest kind of tool to own, and closer to the "developer tools" framing than the
link-sharing tools are.

**Work:** a `lib/` module of pure functions (no React, no DB — AGENT.md file conventions) plus one
card with sub-tabs, or four small cards. Keep it client-side; a server round-trip would buy nothing
and add rate limiting and cost.

**Effort:** Small.

---

## Tier 2 — natural extensions of what already exists

### 4. Burn-after-reading secret

Text Share, but the content is destroyed on first open.

**Work:** add `burn_after_read BOOLEAN DEFAULT false` and `view_count INT DEFAULT 0` to
`shared_texts`; destroy the row in `app/t/[code]/page.tsx` after the first successful render, and
add the branch to `destroyToolItem()`. The expiry picker, ownership, profile listing and countdown
all come for free.

**Effort:** Small–Medium.

**Edge case:** two simultaneous opens race. First render wins, the second gets a 404 — acceptable,
but say so in the UI copy ("opened once, then gone").

### 5. OG debugger / link preview checker

What a crawler actually sees: every `<meta>` dumped raw, the resolved image, and the redirect chain —
useful for debugging why a shared link previews badly.

**Work:** `parseOGMetadata()` already returns the resolved values; a raw tag dump means returning
`buildMetaMap()`'s output too. **Prefer a "raw" tab inside the Meta Scraper card over a separate
card** — same backend, less page weight.

**Effort:** Small (folded into #1).

### 6. URL health / redirect checker

Status code, redirect chain, final URL, response time and content-type for any URL.

**Work:** a server fetch following the `parseOGMetadata` shape — 6s abort signal, capped read.
Same SSRF guard required.

**Effort:** Small–Medium.

---

## Tier 3 — real cost or real risk

### 7. Image compressor / resizer

Upload an image, pick a quality, download the compressed result. Cloudinary is already configured
and can transform by URL, so this is mostly a slider and a result block.

**Why it's Tier 3:** it's the only idea here with genuine marginal cost — every upload burns
Cloudinary credits. It also needs the file-transfer protections (size cap, extension/MIME
blocklist, 1/interval rate limit) and its own temp cleanup.

**Effort:** Medium.

### 8. Markdown → share

Text Share with a `format` column, rendering real markdown on `/t/[code]`.

**Why it's Tier 3:** `/t/[code]` renders the content inside an escaped `<pre>` today, so this is safe
by construction. Rendering HTML means a sanitizer dependency and a real XSS surface on a page whose
whole point is that the content is untrusted. Only worth it if you add
`sanitize-html`/`DOMPurify` and strip raw HTML.

**Effort:** Medium.

---

## Required before exposing any URL-fetching tool

`parseOGMetadata()` in `services/linkParser.service.ts` fetches the user-supplied URL directly with no
host restrictions:

```ts
const res = await fetch(url, {
  headers: { 'User-Agent': '...' },
  signal: AbortSignal.timeout(6000),
  redirect: 'follow',
});
```

On a public tools page that is an SSRF primitive. Before shipping Meta Scraper, the OG debugger or the
URL health checker, add a shared guard that:

- Rejects non-`http(s)` schemes.
- Rejects loopback and private ranges — `localhost`, `127.0.0.0/8`, `::1`, `10/8`, `172.16/12`,
  `192.168/16`, `169.254.169.254` (cloud metadata), `.internal` / `.local`, and `0.0.0.0`.
- Re-validates **after** each redirect (`redirect: 'manual'` and follow in a loop, capping the hops)
  — `redirect: 'follow'` lets a public host bounce you to `169.254.169.254`.
- Caps response size and timeout (already done) and rate limits per IP via `lib/rate-limit.ts`.

---

## Deliberately not planned

- **DNS / whois / IP geolocation** — needs a third-party API key and a quota to manage, for little
  gain over the terminal.
- **Screenshot service** — another paid dependency and a heavy render farm to babysit.
- **Anything that fetches user URLs without the SSRF guard above.**
