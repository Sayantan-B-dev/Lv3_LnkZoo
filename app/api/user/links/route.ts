import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(sp.get('limit') ?? '20'));
  const offset = (page - 1) * limit;
  const sort = sp.get('sort') ?? 'created_at';
  const order = sp.get('order') ?? 'desc';
  const q = sp.get('q') ?? '';

  const allowedSorts = ['created_at', 'title', 'like_count', 'view_count', 'comment_count', 'click_count'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const userId = session.user_id;
  const searchPattern = `%${q}%`;

  const countParams: any[] = [userId];
  const countWhere = q
    ? `AND (title ILIKE $2 OR description ILIKE $2 OR original_url ILIKE $2)`
    : '';
  if (q) countParams.push(searchPattern);

  const [countRow] = await query(
    `SELECT COUNT(*)::int AS total FROM links WHERE user_id = $1 ${countWhere}`,
    countParams,
  );

  const dataParams: any[] = [userId];
  const dataWhere = q
    ? `AND (l.title ILIKE $2 OR l.description ILIKE $2 OR l.original_url ILIKE $2)`
    : '';
  if (q) dataParams.push(searchPattern);
  dataParams.push(limit, offset);

  const rows = await query(
    `SELECT l.id, l.title, l.description, l.original_url, l.short_code, l.preview_image,
            l.visibility, l.is_anonymous, l.like_count, l.comment_count, l.view_count, l.click_count,
            l.created_at, l.updated_at, l.topic_id,
            t3.slug AS topic_slug, t3.name AS topic_name, t3.color AS topic_color,
            COALESCE(
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
              ARRAY[]::text[]
            ) AS tags
     FROM links l
     LEFT JOIN link_tags lt ON lt.link_id = l.id
     LEFT JOIN tags t ON t.id = lt.tag_id
     LEFT JOIN topics t3 ON l.topic_id = t3.id
     WHERE l.user_id = $1 ${dataWhere}
     GROUP BY l.id, t3.slug, t3.name, t3.color
     ORDER BY ${sortCol} ${sortOrder}
     LIMIT $${q ? 3 : 2} OFFSET $${q ? 4 : 3}`,
    dataParams,
  );

  return NextResponse.json({
    links: rows,
    total: countRow?.total ?? 0,
    page,
    limit,
    sort: sortCol,
    order: sortOrder.toLowerCase(),
  });
});
