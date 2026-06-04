import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

// GET /api/notifications
export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT n.id, n.type, n.entity_id, n.message, n.is_read, n.created_at,
           u.username AS actor_username, u.avatar_url AS actor_avatar
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = ${session.user_id}
    ORDER BY n.created_at DESC
    LIMIT 30
  `;

  const unread = rows.filter((r: any) => !r.is_read).length;
  return NextResponse.json({ notifications: rows, unread });
});

// PATCH /api/notifications — mark all read
export const PATCH = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await sql`UPDATE notifications SET is_read = true WHERE user_id = ${session.user_id}`;
  return NextResponse.json({ ok: true });
});