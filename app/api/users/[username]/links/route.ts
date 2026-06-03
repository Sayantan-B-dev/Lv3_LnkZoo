import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const { username } = params;

  try {
    const rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count,
             l.comment_count, l.view_count, l.created_at,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE u.username = ${username.toLowerCase()}
        AND l.is_private = false
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;

    return NextResponse.json({ links: rows });
  } catch (err) {
    console.error('[GET /api/users/[username]/links]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
