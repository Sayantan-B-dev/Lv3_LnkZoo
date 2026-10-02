import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import * as jose from 'jose';

const COOKIE_NAME = 'lnkzoo_token';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

let cachedSecret: Uint8Array | undefined;

/**
 * Resolved lazily (not at import time) so `next build` can collect page data
 * / prerender without JWT_SECRET set. The throw only happens when a token is
 * actually signed or verified in a production runtime without the secret.
 */
function getSecret(): Uint8Array {
  if (!cachedSecret) {
    const rawSecret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production' && !rawSecret) {
      throw new Error('JWT_SECRET is not set. Set it in your deployment environment.');
    }
    cachedSecret = new TextEncoder().encode(rawSecret ?? 'development-insecure-secret');
  }
  return cachedSecret;
}

export interface JWTPayload {
  user_id: string;
  username: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch (err) {
    return null;
  }
}

/** Sync verification for Middleware (Next.js Middleware can be async) */
export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return await verifyToken(cookieToken);

  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return await verifyToken(authHeader.slice(7));
  }
  return null;
}

/** Get auth from server component cookies (App Router) */
export async function getSessionFromCookies(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export function cookieOptions(req?: NextRequest) {
  const isHttps = req
    ? req.nextUrl.protocol === 'https:' ||
      req.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'https'
    : process.env.NODE_ENV === 'production';
  return {
    name: COOKIE_NAME,
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax' as const,
    path: '/',
  };
}
