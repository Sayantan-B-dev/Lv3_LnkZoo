import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const { username } = params;

  try {
    const rows = await sql`
      SELECT u.id, u.username, u.avatar_url, u.karma
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      JOIN users target ON f.followee_id = target.id
      WHERE target.username = ${username.toLowerCase()}
      ORDER BY f.created_at DESC
    `;
    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
