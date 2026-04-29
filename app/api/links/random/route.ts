import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /api/links/random
export async function GET(_req: NextRequest) {
  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.is_anonymous, l.upvote_count, l.downvote_count,
           l.comment_count, l.view_count, l.created_at,
           u.username, u.avatar_url,
           ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
    FROM links l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    WHERE l.is_private = false
    GROUP BY l.id, u.username, u.avatar_url
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (!rows.length) return NextResponse.json({ error: 'No links found' }, { status: 404 });
  return NextResponse.json({ link: rows[0] });
}
