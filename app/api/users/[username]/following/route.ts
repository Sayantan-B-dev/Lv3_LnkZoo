import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const { username } = params;

  try {
    const rows = await sql`
      SELECT u.id, u.username, u.avatar_url,
             (SELECT COUNT(*)::int FROM links WHERE user_id = u.id AND is_private = false) AS link_count
      FROM follows f
      JOIN users u ON f.followee_id = u.id
      JOIN users follower ON f.follower_id = follower.id
      WHERE follower.username = ${username.toLowerCase()}
      ORDER BY f.created_at DESC
    `;
    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});