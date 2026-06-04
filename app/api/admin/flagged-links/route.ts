import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const rows = await sql`
    SELECT l.id, l.original_url, l.title, l.flagged_count, l.created_at,
           u.username, u.id as user_id
    FROM links l
    JOIN users u ON u.id = l.user_id
    WHERE l.flagged_count > 0
    ORDER BY l.flagged_count DESC
  `;

  return NextResponse.json({ links: rows });
});
