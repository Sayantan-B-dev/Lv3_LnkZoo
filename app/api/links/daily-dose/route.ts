import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (_req: NextRequest) => {
  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.is_anonymous, l.like_count, l.visibility,
           l.comment_count, l.view_count, l.created_at,
           u.username, u.avatar_url,
           ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
    FROM links l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    WHERE l.visibility = 'public'
      AND l.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY l.id, u.username, u.avatar_url
    ORDER BY l.like_count DESC
    LIMIT 5
  `;

  return NextResponse.json({ links: rows });
});
