import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /api/tags — list all tags sorted by usage
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q'); // search/autocomplete

  if (q) {
    const rows = await sql`
      SELECT id, name, normalized_name, usage_count
      FROM tags
      WHERE normalized_name LIKE ${q.toLowerCase() + '%'}
      ORDER BY usage_count DESC
      LIMIT 10
    `;
    return NextResponse.json({ tags: rows });
  }

  const rows = await sql`
    SELECT id, name, normalized_name, usage_count
    FROM tags
    ORDER BY usage_count DESC
    LIMIT 100
  `;
  return NextResponse.json({ tags: rows });
}
