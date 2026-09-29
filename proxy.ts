import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  ADMIN_FORBIDDEN_PATH,
  isAdminOnlyPath,
  isAdminRole,
  isProtectedPath,
} from '@/lib/policies';

/**
 * Page-level access. This is only the browser-facing half of the policy — the
 * API routes re-check independently via `lib/policies.ts`, because middleware
 * does not run for every request and is not a substitute for a guard.
 *
 * The path lists live in `lib/policies.ts` so the rule and the doc cannot drift.
 * `config.matcher` below must stay in sync with them: a path missing from the
 * matcher never reaches this function at all.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(ADMIN_FORBIDDEN_PATH)) {
    return NextResponse.next();
  }

  const isProtected = isProtectedPath(pathname);
  const isAdminOnly = isAdminOnlyPath(pathname);

  if (isProtected || isAdminOnly) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (isAdminOnly && !isAdminRole(session.role)) {
      return NextResponse.redirect(new URL(ADMIN_FORBIDDEN_PATH, req.url));
    }
  }

  return NextResponse.next();
}

// Keep in sync with PROTECTED_PATHS + ADMIN_ONLY_PATHS in lib/policies.ts.
// `/feedback` is deliberately absent: the board is public to read, and posting
// is gated in the API rather than by a redirect.
export const config = {
  matcher: ['/submit', '/profile/:path*', '/notifications', '/admin/:path*'],
};
