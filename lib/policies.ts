import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, type JWTPayload } from '@/lib/auth';

/**
 * The app's access policy, in one place.
 *
 * There are three layers, and each one assumes the layer below it already ran:
 *
 *   1. `proxy.ts`      — page access (redirects a browser to /login).
 *   2. this module     — per-request API access (`requireSession` / `requireAdmin`).
 *   3. `services/*`    — per-row ownership and visibility, enforced **inside the
 *                        SQL statement** so a guessed id cannot reach a row the
 *                        caller does not own.
 *
 * Layer 3 is the one that matters: a route-level check says "you may call this",
 * never "you may touch this row", so anything scoped to a user must repeat the
 * predicate in the query. `/feedback` is the worked example — reads are public
 * but the predicate still decides which rows come back.
 *
 * The full matrix is written down in `docs/policies.md`.
 */

/** Pages that require a session. `/feedback` is deliberately absent — it is public. */
export const PROTECTED_PATHS = ['/submit', '/profile', '/notifications'] as const;

/** Pages that additionally require `role === 'admin'`. */
export const ADMIN_ONLY_PATHS = ['/admin'] as const;

/** The one page allowed inside a protected prefix without a session. */
export const ADMIN_FORBIDDEN_PATH = '/admin/forbidden';

export const ADMIN_ROLE = 'admin';

export function isAdminRole(role: string | null | undefined): boolean {
  return role === ADMIN_ROLE;
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
}

type Guard<T> = { ok: true; session: T } | { ok: false; response: NextResponse };

/**
 * 401 unless the request carries a valid session. The error body is the same
 * shape every route returns, so a client can always read `error`.
 */
export async function requireSession(req: NextRequest): Promise<Guard<JWTPayload>> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Please sign in' }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

/**
 * 401 without a session, 403 without the admin role. The role is read from the
 * signed JWT, never from a header or body the caller controls.
 */
export async function requireAdmin(req: NextRequest): Promise<Guard<JWTPayload>> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Please sign in' }, { status: 401 }),
    };
  }
  if (!isAdminRole(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admins only' }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

/**
 * Owner-or-admin. Used by "edit or delete your own thing" routes; the same test
 * still has to appear in the SQL, this only decides whether to bother.
 */
export function canManage(
  viewerId: string,
  ownerId: string | null | undefined,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  return !!ownerId && ownerId === viewerId;
}

/** Best-effort client address, used for IP-keyed rate limits. */
export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}
