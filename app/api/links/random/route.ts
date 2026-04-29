import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const excludeId = req.nextUrl.searchParams.get('exclude') || null;

  try {
    const rows = await sql`
      SELECT l.*, u.username, u.avatar_url,
             (SELECT ARRAY_AGG(t.name) FROM link_tags lt JOIN tags t ON lt.tag_id = t.id WHERE lt.link_id = l.id) as tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      WHERE l.is_private = false
      AND ((${excludeId}::text) IS NULL OR l.id::text != (${excludeId}::text))
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (!rows.length) {
      // If no result (could happen if we exclude the only link), fetch ANY link
      const fallback = await sql`
        SELECT l.*, u.username, u.avatar_url,
               (SELECT ARRAY_AGG(t.name) FROM link_tags lt JOIN tags t ON lt.tag_id = t.id WHERE lt.link_id = l.id) as tags
        FROM links l
        JOIN users u ON l.user_id = u.id
        WHERE l.is_private = false
        ORDER BY RANDOM()
        LIMIT 1
      `;
      
      if (!fallback.length) {
        return NextResponse.json({ error: 'No links found' }, { status: 404 });
      }
      return NextResponse.json({ link: fallback[0] });
    }

    return NextResponse.json({ link: rows[0] });
  } catch (err) {
    console.error('[Random API Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
