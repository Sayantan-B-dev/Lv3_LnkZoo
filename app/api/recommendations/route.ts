import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/recommendations — personalised "for you" feed
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    // Unauthenticated: just return hot feed
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
      ORDER BY l.upvote_count DESC
      LIMIT 20
    `;
    return NextResponse.json({ links: rows });
  }

  // Fetch user interests
  const [user] = await sql`SELECT interests FROM users WHERE id = ${session.user_id}`;
  const interests: string[] = user?.interests ?? [];

  if (interests.length === 0) {
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
      ORDER BY l.upvote_count DESC
      LIMIT 20
    `;
    return NextResponse.json({ links: rows });
  }

  // Personalised: boost links tagged with user's interests
  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.is_anonymous, l.upvote_count, l.downvote_count,
           l.comment_count, l.view_count, l.created_at,
           u.username, u.avatar_url,
           ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags,
           COUNT(DISTINCT CASE WHEN t.normalized_name = ANY(${interests}) THEN t.id END) AS interest_match
    FROM links l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    WHERE l.is_private = false
    GROUP BY l.id, u.username, u.avatar_url
    ORDER BY interest_match DESC, l.upvote_count DESC
    LIMIT 20
  `;

  return NextResponse.json({ links: rows });
}
