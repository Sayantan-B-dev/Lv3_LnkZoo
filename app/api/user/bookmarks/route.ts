import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.visibility, l.like_count, l.comment_count, l.created_at,
           u.username, u.avatar_url,
           EXISTS (SELECT 1 FROM link_likes ll WHERE ll.link_id = l.id AND ll.user_id = ${session.user_id}) AS liked_by_user,
           ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
    FROM saved_links sl
    JOIN links l ON l.id = sl.link_id
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    WHERE sl.user_id = ${session.user_id}
    GROUP BY sl.id, l.id, u.username, u.avatar_url
    ORDER BY sl.created_at DESC
  `;

  return NextResponse.json({ bookmarks: rows });
});
