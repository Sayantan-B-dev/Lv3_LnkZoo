import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [target] = await sql`SELECT id FROM users WHERE username = ${params.username.toLowerCase()}`;
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.id === session.user_id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });

  await sql`
    INSERT INTO blocks (blocker_id, blocked_id)
    VALUES (${session.user_id}, ${target.id})
    ON CONFLICT DO NOTHING
  `;

  await sql`DELETE FROM follows WHERE follower_id = ${session.user_id} AND followee_id = ${target.id}`;
  await sql`DELETE FROM follows WHERE follower_id = ${target.id} AND followee_id = ${session.user_id}`;

  return NextResponse.json({ blocked: true });
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [target] = await sql`SELECT id FROM users WHERE username = ${params.username.toLowerCase()}`;
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await sql`
    DELETE FROM blocks WHERE blocker_id = ${session.user_id} AND blocked_id = ${target.id}
  `;

  return NextResponse.json({ blocked: false });
});
