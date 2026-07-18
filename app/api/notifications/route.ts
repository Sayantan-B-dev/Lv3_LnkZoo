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

// PATCH /api/notifications - mark all read or bulk mark
export const PATCH = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids = body?.ids;
  const isRead = body?.is_read;

  if (Array.isArray(ids)) {
    if (ids.length === 0) return NextResponse.json({ ok: true });
    await sql`
      UPDATE notifications SET is_read = ${isRead ?? true}
      WHERE id = ANY(${ids}) AND user_id = ${session.user_id}
    `;
  } else {
    await sql`UPDATE notifications SET is_read = true WHERE user_id = ${session.user_id}`;
  }

  return NextResponse.json({ ok: true });
});