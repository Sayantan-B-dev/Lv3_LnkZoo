# Next.js 14.2.3 → 16.2.7 Upgrade Plan

## Scope Summary

| Change | Files | Difficulty |
|---|---|---|
| React 18 → 19 | whole project | Hard |
| Route handler params → `Promise` | 40 API routes | Medium |
| Page params → `Promise` | 3 pages | Easy |
| `cookies()` → async | 1 file (`lib/auth.ts`) | Easy |
| `next.config.js` fixes | 1 file | Easy |
| `next/link`, `next/image` | 0 files need changes | None |

---

## Step 1: Upgrade React 18 → 19

1. Install React 19 + new types
2. Check `react-easy-crop` v5.5.7 compatibility with React 19
3. Fix any TypeScript errors from type changes
4. Build to verify

## Step 2: Upgrade Next.js 14 → 15

1. Install Next.js 15 + compatible eslint-config-next
2. Fix route handler params (make `Promise` + `await`)
3. Fix page component params (make `Promise` + `await`)
4. Fix `cookies()` → `await cookies()` in `lib/auth.ts`
5. Update `next.config.js`:
   - `remotePatterns` wildcard → explicit hostnames
   - `experimental.serverComponentsExternalPackages` → `serverExternalPackages`
6. Build to verify

## Step 3: Upgrade Next.js 15 → 16

1. Install Next.js 16 + compatible deps
2. Fix any 15→16 breaking changes
3. Build to verify

## Step 4: Final verification

1. Full build
2. Test key pages
3. Verify API routes work
