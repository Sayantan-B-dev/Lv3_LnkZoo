import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  try {
    const rows = await sql`
      SELECT id, name, usage_count
      FROM tags
      ORDER BY usage_count DESC
      LIMIT 100
    `;
    return NextResponse.json({ tags: rows });
  } catch (err) {
    console.error('[GET /api/tags]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});