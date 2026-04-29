import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const rows = await sql`
    SELECT id, username, email, avatar_url, bio, website, interests,
           karma, streak, is_admin, created_at
    FROM users WHERE id = ${session.userId} LIMIT 1
  `;
  if (!rows.length) return NextResponse.json({ user: null }, { status: 404 });

  return NextResponse.json({ user: rows[0] });
}
