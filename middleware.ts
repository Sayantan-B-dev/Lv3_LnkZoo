import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

const PROTECTED = ['/submit', '/profile', '/notifications'];
const ADMIN_ONLY = ['/admin'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAdmin = ADMIN_ONLY.some(p => pathname.startsWith(p));

  if (isProtected || isAdmin) {
    const session = getSessionFromRequest(req);
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (isAdmin && !session.is_admin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/submit', '/profile/:path*', '/notifications', '/admin/:path*'],
};
