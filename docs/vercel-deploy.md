# Vercel Deploy Notes — Oct 2026 incident

Local `npm run build` passed while Vercel failed four times in a row, each
failure hiding behind the previous one. This doc records every cause and the
rule that prevents a repeat. Read it before touching env handling, SDK
imports, route names, or `.gitignore`.

## 1. Never throw at import time on env vars

`lib/auth.ts` threw `JWT_SECRET is not set` at module scope when
`NODE_ENV=production`, and `lib/db.ts` ran `neon(process.env.NEON_DATABASE_URL!)`
at module scope. Local builds survived because `.env*` files exist locally;
Vercel builds only have dashboard env, so page-data collection died on import.

**Rule:** env is resolved lazily (first request-time use), never at module
scope. A missing value must fail loudly where it is used, not kill the build.
Current shape: `lib/auth.ts` → `getSecret()`, `lib/db.ts` → `getPool()` /
`getNeonSql()`.

## 2. Never `new URL()` an env var at module scope

`app/layout.tsx` ran `metadataBase: new URL(baseUrl)` at module scope.
Metadata is evaluated for every route (including `/_not-found`), so a
scheme-less value — or Vercel's local `[SENSITIVE]` placeholder, see §5 —
killed config collection with `TypeError: Invalid URL`.

**Rule:** wrap in a resolver with a fallback. Current shape:
`resolveBaseUrl()` in `app/layout.tsx` (requires `http(s)://`, else falls back
to `https://lnkzoo.vercel.app`). Same applies to any future
`new URL(process.env.…)` at module scope — grep before adding one.

## 3. Never statically import the Cloudinary SDK in route graphs

Merely *evaluating* `cloudinary` throws: `uploader.js` (and `api_client/*`,
`utils/index.js`) call `config()` at require time, which parses
`CLOUDINARY_URL` and rejects anything not starting with `cloudinary://`.
ESM imports evaluate before any sanitizer body can run, so no
sanitize-after-import can save a static import — three attempts proved it.

**Rule:** only `lib/cloudinary.ts` touches the package, via
`await getCloudinary()`: sanitize env → dynamic `import('cloudinary')` →
explicit-key `config()`. Call sites (`services/feedback.service.ts`,
`lib/tempFiles.ts`, `app/api/upload/route.ts`, `app/f/[code]/route.ts`) all
`await` it. Never `import { v2 } from 'cloudinary'` anywhere else — grep
enforces this.

## 4. Never name a route segment `index`

`app/(main)/index/page.tsx` (the manual, added Oct 2026) created a literal
`/index` route, making Next emit `app/index/index.segments/…` prerender
output. All 66 pages generated, then Vercel's `onBuildComplete` failed with
`ENOENT … __PAGE__.segment.rsc` — the segment name collides with the internal
`index.*` output-file convention. Renamed to `/manual` (commit `e986f05`);
`navRoutes` id/href, sidebar icon key, and hero link moved with it.

**Rule:** `index` is effectively reserved as a segment name. Name the folder
what the page is.

## 5. Local `vercel build` lies about secret values

Local `npx vercel build` writes `.vercel/.env.preview.local` with redacted
vars as literal `[SENSITIVE]` placeholders (every value exactly 11 chars),
and those take precedence over `.env*` files. So a local Vercel build can
fail on `Invalid URL` / `Invalid CLOUDINARY_URL protocol` while both the
plain local build and the real cloud deploy are fine. Rules §1–§3 make the
build immune to this, but when diagnosing: check shapes with
`node -e` / length checks, never paste values.

`.vercel/` is gitignored and must never be committed (it can hold an OIDC
token). Note: the Vercel CLI appends a duplicate `.vercel` line to
`.gitignore` on local runs — already covered by the `.vercel/` entry, revert
the duplicate if it reappears.

## 6. Windows-only: local `EPERM … symlink`

At the very end of a *passing* local `vercel build`, function deduplication
creates symlinks and Windows blocks unprivileged symlink creation
(`EPERM: operation not permitted, symlink …`). Remote (Linux) deploys never
hit this. Fix: Settings → System → For developers → Developer Mode ON, or
run the shell as Administrator for the local build.

## 7. Keep the lockfile committed

`package-lock.json` was gitignored, so local installed Next `16.2.7` while
Vercel freshly resolved `16.3.7` from the `^` range. The npm lockfile is
committed (yarn/pnpm locks stay ignored); `.env.example` is explicitly
un-ignored (`!.env.example`) so the template ships while values never do.

## Deploy checklist

- [ ] Dashboard → Settings → Environment Variables (Production): `JWT_SECRET`,
      `NEON_DATABASE_URL`, `NEXT_PUBLIC_*`, `GOOGLE_*`, `CLOUDINARY_*`,
      `CRON_SECRET`, `OPENROUTER_*` — all with scheme on URL values.
- [ ] `git status` clean of `.env*` values and `.vercel/` before push.
- [ ] After structural route changes, redeploy with cleared build cache once
      so stale output layout can't linger.
