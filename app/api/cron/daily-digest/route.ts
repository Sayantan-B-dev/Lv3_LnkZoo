import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  try {
    const topLinks = await sql`
      SELECT l.id, l.title, l.original_url, l.like_count, l.created_at,
             u.username
      FROM links l
      JOIN users u ON u.id = l.user_id
      WHERE l.created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY l.like_count DESC
      LIMIT 10
    `;

    return NextResponse.json({ digest: topLinks });
  } catch (err) {
    console.error('[CRON daily-digest]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});