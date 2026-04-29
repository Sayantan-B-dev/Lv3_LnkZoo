import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';

// POST /api/users/[username]/follow — toggle follow
export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [target] = await sql`SELECT id FROM users WHERE username = ${params.username.toLowerCase()}`;
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.id === session.user_id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

  const [existing] = await sql`
    SELECT 1 FROM follows WHERE follower_id = ${session.user_id} AND followee_id = ${target.id}
  `;

  if (existing) {
    await sql`DELETE FROM follows WHERE follower_id = ${session.user_id} AND followee_id = ${target.id}`;
    return NextResponse.json({ following: false });
  }

  await sql`INSERT INTO follows (follower_id, followee_id) VALUES (${session.user_id}, ${target.id})`;

  await notificationService.create({
    user_id: target.id,
    actor_id: session.user_id,
    type: 'follow',
    entity_id: session.user_id,
    message: `started following you`,
  });

  return NextResponse.json({ following: true });
}
