import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// PATCH /api/users/profile
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bio, avatar_url, cover_url, website, interests } = await req.json();

    const [user] = await sql`
      UPDATE users
      SET bio = ${bio ?? null},
          avatar_url = ${avatar_url ?? null},
          cover_url = ${cover_url ?? null},
          website = ${website ?? null},
          interests = ${interests ?? null}
      WHERE id = ${session.user_id}
      RETURNING id, username, email, avatar_url, cover_url, bio, website, interests,  streak, is_admin
    `;

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[PATCH /api/users/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
