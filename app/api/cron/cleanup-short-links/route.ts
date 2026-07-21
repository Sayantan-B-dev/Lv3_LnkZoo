import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  try {
    await sql`DELETE FROM shortened_links WHERE created_at <= NOW() - INTERVAL '1 day'`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[CRON cleanup-short-links]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
