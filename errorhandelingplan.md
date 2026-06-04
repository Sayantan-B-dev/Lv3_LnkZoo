# Error Handling & Security Plan

## 1. Current Risk Assessment

### Critical (crash-capable)
| Issue | Location | Impact |
|-------|----------|--------|
| Many API routes lack try/catch | 20+ routes | Unhandled rejections crash the route process |
| No global API error boundary | All `app/api/` | Every uncaught throw returns 500 with no handler |
| `link_likes` table assumed present | Admin stats query | 500 error if migration not run |
| `fetch()` in parse route has 6s timeout but no try/catch around response text parsing | `tools/parse` | Crash on malformed response |
| Session from request can fail silently | All routes calling `getSessionFromRequest` | Returns `null`, downstream assumes valid user |

### High (data/security risk)
| Issue | Location | Impact |
|-------|----------|--------|
| No rate limiting on any endpoint | All API routes | Brute force, DDoS amplification |
| No CSRF protection | All POST/PATCH/DELETE routes | Cross-site request forgery |
| Open redirect via `from` param | Login page | Phishing vector (`/login?from=https://evil.com`) |
| No input size limits | All POST routes | Memory exhaustion via large payloads |
| No SQL injection protection in `query()` fallback | `lib/db.ts` production path | Raw string interpolation used |
| Password no minimum complexity | Register route | Weak account security |
| No email verification | Auth system | Fake/spam accounts |
| File upload no server-side type validation | Upload route | Arbitrary file upload to Cloudinary |

### Medium (UX/resilience)
| Issue | Location | Impact |
|-------|----------|--------|
| No retry logic on DB transient failures | All DB queries | 500 on connection pool exhaustion |
| No caching headers | All API routes | Every request hits DB |
| N+1 queries in tag upsert loop | `links` POST route (line 176-192) | Slow for many tags |
| Most responses typed as `any` | All routes | No compile-time contract checking |
| `console.error` used instead of structured logging | Everywhere | No log aggregation possible |

### Low (edge cases)
| Issue | Location | Impact |
|-------|----------|--------|
| No `robots.tsx` | Site root | No bot crawl policy defined |
| No security headers (CSP, HSTS) | Next.js config | Browser-level protections missing |
| No referrer policy | Root layout | URL leakage on navigation |
| Empty service files | `services/*.service.ts` | Dead code, confusing imports |

---

## 2. Implementation Plan (Phase Priority)

### Phase 1 — Critical Fixes (immediate)

#### 1.1 Global API Error Wrapper
```typescript
// lib/api-utils.ts
export function apiHandler(handler: (req: NextRequest, params?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, params?: any) => {
    try {
      return await handler(req, params);
    } catch (err) {
      console.error('[API Error]', req.method, req.nextUrl.pathname, err);
      return NextResponse.json(
        { error: 'Internal server error', requestId: crypto.randomUUID() },
        { status: 500 }
      );
    }
  };
}
```
Apply to every route by wrapping the exported function.

#### 1.2 Add try/catch to all unprotected routes
Targets: admin/ban, admin/flagged-links, admin/links/[id], auth/me, auth/logout, comments POST, comments GET, leaderboard, links GET/[id]/DELETE/PATCH, links/daily-dose, notifications, recommendations, users GET/users/[username], s/[code]

#### 1.3 Validate `link_likes` table existence
Add a check query in the admin stats route:
```sql
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'link_likes')
```

#### 1.4 Fix open redirect
In login page, validate the `from` param is a relative path (starts with `/` and not `//`):
```typescript
const from = searchParams.get('from') || '/';
const safeFrom = from.startsWith('/') && !from.startsWith('//') ? from : '/';
```

---

### Phase 2 — Security Hardening

#### 2.1 Rate Limiting (in-memory)
```typescript
// lib/rate-limit.ts
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
```
Apply strict limits:
- Auth routes: 5/min per IP
- Link creation: 30/min per user
- General API: 100/min per IP

#### 2.2 Security Headers via Next.js config
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://apis.google.com; connect-src 'self' https:;" },
      ],
    },
  ];
}
```

#### 2.3 Request body size limits
Add early-exit size check in every POST/PATCH route:
```typescript
const contentLength = parseInt(req.headers.get('content-length') || '0');
if (contentLength > 100_000) { // 100KB
  return NextResponse.json({ error: 'Request too large' }, { status: 413 });
}
```

#### 2.4 Input sanitization
- Strip HTML tags from title, description, bio, comment content
- Validate URLs with URL constructor (not just regex)
- Reject URLs with `javascript:`, `data:`, `vbscript:` schemes
- Enforce password: min 8 chars, at least one letter and one number

#### 2.5 Password policy enforcement
In register route:
```typescript
if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
  return NextResponse.json({ error: 'Password must be 8+ chars with letters and numbers' }, { status: 422 });
}
```

#### 2.6 File upload validation
Add server-side MIME type validation:
```typescript
const base64Data = image.replace(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, '');
if (base64Data === image) {
  return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
}
```

#### 2.7 Bot control — robots.tsx
```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/login', '/register'] },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
    ],
    sitemap: 'https://glinqx.io/sitemap.xml',
  };
}
```

---

### Phase 3 — Resilience & Error Recovery

#### 3.1 Graceful DB error handling
Wrap all `sql` template tag calls in a retry helper:
```typescript
// lib/db.ts
export async function sqlWithRetry(queries: TemplateStringsArray, ...values: any[], retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await sql(queries, ...values);
    } catch (err: any) {
      if (i === retries || !isRetryable(err)) throw err;
      await new Promise(r => setTimeout(r, 100 * Math.pow(2, i)));
    }
  }
}
```
Retryable errors: `40P01` (deadlock), `57P01` (server unavailable), connection timeout.

#### 3.2 Structured logging
Replace all `console.error` with:
```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
  },
};
```

#### 3.3 API response type safety
Replace `any` with proper interfaces for all API responses. Create `lib/types.ts`:
```typescript
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  requestId?: string;
}

export interface LinkResponse {
  id: string;
  shortCode: string;
  title: string;
  // ...
}
```

#### 3.4 Client-side fetch wrapper
```typescript
// lib/fetch-client.ts
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || 'Request failed', res.status);
  }
  return res.json();
}
```

---

### Phase 4 — DDoS & Abuse Protection

#### 4.1 IP-based rate limiting (strict)
| Endpoint Group | Window | Max Requests |
|----------------|--------|-------------|
| `/api/auth/*` | 1 min | 5 |
| `/api/links` (POST) | 1 min | 30 per user |
| `/api/links/bulk` | 5 min | 3 per user |
| `/api/comments` (POST) | 1 min | 20 per user |
| `/api/upload` | 5 min | 10 per user |
| All other API | 1 min | 100 per IP |

#### 4.2 Concurrent request limiting
```typescript
// lib/concurrency-limit.ts
const activeRequests = new Map<string, number>();

export function checkConcurrency(key: string, max: number): boolean {
  const current = activeRequests.get(key) || 0;
  if (current >= max) return false;
  activeRequests.set(key, current + 1);
  return true;
}

export function releaseConcurrency(key: string) {
  const current = activeRequests.get(key) || 0;
  if (current <= 1) activeRequests.delete(key);
  else activeRequests.set(key, current - 1);
}
```

#### 4.3 Early payload rejection
Before JSON parsing, reject oversized payloads (already covered in Phase 2).

#### 4.4 Slowloris protection
Set request timeouts:
```typescript
// next.config.js
export const config = {
  api: {
    bodyParser: { sizeLimit: '100kb', responseLimit: '1mb' },
    externalResolver: true,
  },
};
```

---

### Phase 5 — Monitoring & Observability

#### 5.1 Request ID tracing
Every API response includes a `requestId` (see Phase 1.1). Log this on errors.

#### 5.2 Health check endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

#### 5.3 Error tracking middleware
In root layout or API wrapper, catch unhandled promise rejections and log them with full context (path, method, user if available, timestamp).

---

## 3. File Manifest

### New files to create:
```
lib/api-utils.ts          — API handler wrapper, error formatting
lib/rate-limit.ts          — In-memory rate limiter
lib/concurrency-limit.ts   — Active request tracker
lib/logger.ts              — Structured JSON logger
lib/types.ts               — Shared type definitions
lib/fetch-client.ts        — Client-side typed fetch wrapper
app/robots.ts              — Bot crawl rules
app/api/health/route.ts    — Health check endpoint
```

### Files to modify:
```
app/api/*/route.ts         — Wrap all handlers with apiHandler()
app/layout.tsx              — Add security meta tags
next.config.js              — Add security headers, body size limits
lib/db.ts                   — Add retry logic
app/login/page.tsx          — Fix open redirect
app/register/page.tsx       — Add password policy
app/api/auth/register/route.ts — Add password validation
```

---

## 4. Boundary of Feasibility

### What IS feasible in this architecture:
- Input validation and sanitization (parameterized queries already in place for `sql()`)
- Rate limiting (in-memory, no external DB needed)
- Security headers (Next.js headers() config)
- Error boundaries (try/catch wrappers)
- Request ID tracing (UUID per request)
- Bot control (Next.js robots.ts)
- Open redirect fix (validate `from` param)
- Password policy (add validation)
- File upload validation (MIME check)

### What is NOT feasible without architectural changes:
- **True DDoS protection** — requires CDN-level (Cloudflare, AWS Shield), not app-level
- **Database connection pooling limits** — managed by Neon/PG pool, configurable via env vars
- **MITM prevention** — requires HTTPS enforcement (should be at CDN/load balancer level)
- **Persistent rate limiting across restarts** — in-memory resets on server restart; would need Redis/DB (out of scope)
- **Full type safety across all API routes** — requires migrating from `any` to generated OpenAPI types (months of work)
- **CSP for external embeds** — would break Google Fonts, OAuth callbacks; trade-off accepted

### Cost of over-engineering:
- Adding Redis for rate limiting adds deploy-time complexity for a project with <1000 expected users
- Full OpenAPI codegen adds weeks with zero user-facing value
- Database read replicas, multi-region deploys are premature
- The app-level rate limiter handles the realistic threat model (script kiddies, not nation-states)

---

## 5. Error Recovery Philosophy

```
Non-fatal errors (DB timeout, parse failure, rate limit hit):
  → Log structured error with requestId
  → Return appropriate HTTP status (503, 422, 429)
  → App continues running

Fatal errors (missing env vars, DB migration not run):
  → Log critical error
  → Return 500 with generic message
  → Health check reports unhealthy
  → App continues serving healthy routes

Client errors (invalid input, bad types):
  → Return 400/422 with specific message
  → Log at 'warn' level (not 'error')
  → No crash
```
