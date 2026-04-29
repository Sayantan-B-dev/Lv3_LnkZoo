import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'glinqx_token';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface JWTPayload {
  user_id: string;
  username: string;
  is_admin: boolean;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/** Get auth from server component cookies (App Router) */
export function getSessionFromCookies(): JWTPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Get auth from API request (cookie or Authorization header) */
export function getSessionFromRequest(req: NextRequest): JWTPayload | null {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return verifyToken(cookieToken);

  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7));
  }
  return null;
}

export function cookieOptions() {
  return {
    name: COOKIE_NAME,
    maxAge: MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}
