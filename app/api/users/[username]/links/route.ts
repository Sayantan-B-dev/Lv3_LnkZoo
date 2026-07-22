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
  const sp = req.nextUrl.searchParams;
  const sort = sp.get('sort') ?? 'new';
  const orderBy = ORDER_MAP[sort] || ORDER_MAP.new;
  const uid = session?.user_id ?? null;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'));
  const limit = Math.min(200, parseInt(sp.get('limit') ?? '30'));
  const offset = (page - 1) * limit;
  const domain = sp.get('domain');

  try {
    const visClause = `(l.visibility = 'public'
      OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = l.user_id))
      OR (l.visibility = 'private' AND l.user_id = $2))`;

    const domainClause = domain
      ? ` AND (l.original_url LIKE $5 OR l.original_url LIKE $6)`
      : '';
    const params = [username.toLowerCase(), uid, limit, offset];
    if (domain) params.push(`%//${domain}%`, `%//%.${domain}%`);

    const countDomainClause = domain
      ? ` AND (l.original_url LIKE $3 OR l.original_url LIKE $4)`
      : '';
    const countParams = domain
      ? [username.toLowerCase(), uid, `%//${domain}%`, `%//%.${domain}%`]
      : [username.toLowerCase(), uid];

    const [countRow] = await query(
      `SELECT COUNT(*)::int AS count FROM links l JOIN users u ON l.user_id = u.id WHERE u.username = $1 AND ${visClause}${countDomainClause}`,
      countParams
    );

    const rows = await query(
      `SELECT l.id, l.title, l.description, l.original_url, l.short_code,
              l.preview_image, l.is_anonymous, l.like_count, l.visibility,
              EXISTS (SELECT 1 FROM link_likes ll WHERE ll.link_id = l.id AND ll.user_id = $2) AS liked_by_user,
              l.comment_count, l.view_count, l.created_at,
              u.username, u.avatar_url,
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
       FROM links l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN link_tags lt ON lt.link_id = l.id
       LEFT JOIN tags t ON t.id = lt.tag_id
       WHERE u.username = $1 AND ${visClause}${domainClause}
       GROUP BY l.id, u.username, u.avatar_url
       ORDER BY ${orderBy}
       LIMIT $3 OFFSET $4`,
      params.slice(0, domain ? 6 : 4)
    );

    return NextResponse.json({ links: rows, total: countRow?.count ?? 0, page, limit });
  } catch (err) {
    console.error('[GET /api/users/[username]/links]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
