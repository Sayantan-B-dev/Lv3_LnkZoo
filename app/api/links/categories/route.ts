import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';
import { toCategoryName, extractDomain } from '@/lib/domain';

export const GET = apiHandler(async (req: NextRequest) => {
  try {
    const rows = await sql`
      SELECT l.original_url
      FROM links l
      WHERE l.visibility = 'public'
    `;

    const counts = new Map<string, number>();
    for (const r of rows) {
      const domain = extractDomain(r.original_url);
      const name = toCategoryName(domain);
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    const categories = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 200);

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('[GET /api/links/categories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
