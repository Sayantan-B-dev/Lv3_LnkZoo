import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

const ORDER_MAP: Record<string, string> = {
  new: 'l.created_at DESC',
  oldest: 'l.created_at ASC',
  top: 'l.like_count DESC, l.created_at DESC',
};

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const { username } = params;
  const session = await getSessionFromRequest(req);
  const sort = req.nextUrl.searchParams.get('sort') ?? 'new';
  const orderBy = ORDER_MAP[sort] || ORDER_MAP.new;
  const uid = session?.user_id ?? null;

  try {
    const rows = await query(
      `SELECT l.id, l.title, l.description, l.original_url, l.short_code,
              l.preview_image, l.is_anonymous, l.like_count, l.visibility,
              l.comment_count, l.view_count, l.created_at,
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
       FROM links l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN link_tags lt ON lt.link_id = l.id
       LEFT JOIN tags t ON t.id = lt.tag_id
       WHERE u.username = $1
         AND (l.visibility = 'public'
           OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = l.user_id))
           OR (l.visibility = 'private' AND l.user_id = $2))
       GROUP BY l.id
       ORDER BY ${orderBy}`,
      [username.toLowerCase(), uid]
    );

    return NextResponse.json({ links: rows });
  } catch (err) {
    console.error('[GET /api/users/[username]/links]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
