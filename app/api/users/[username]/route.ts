import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/users/[username]
export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const username = params.username.toLowerCase();

  const [user] = await sql`
    SELECT id, username, avatar_url, bio, website, interests,
           karma, streak, created_at,
           (SELECT COUNT(*) FROM links WHERE user_id = users.id AND is_private = false) AS link_count,
           (SELECT COUNT(*) FROM follows WHERE followee_id = users.id) AS follower_count,
           (SELECT COUNT(*) FROM follows WHERE follower_id = users.id) AS following_count
    FROM users
    WHERE username = ${username} AND is_banned = false
  `;

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check if current viewer follows this user
  const session = getSessionFromRequest(req);
  let isFollowing = false;
  if (session && session.userId !== user.id) {
    const [f] = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${session.userId} AND followee_id = ${user.id}
    `;
    isFollowing = !!f;
  }

  return NextResponse.json({ user: { ...user, isFollowing } });
}
