import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /api/links/daily-dose
export async function GET(_req: NextRequest) {
  // Top 5 links posted in the last 24h by upvotes
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
      AND l.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY l.id, u.username, u.avatar_url
    ORDER BY l.upvote_count DESC
    LIMIT 5
  `;

  return NextResponse.json({ links: rows });
}
