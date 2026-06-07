import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(sp.get('limit') ?? '20'));
  const offset = (page - 1) * limit;
  const search = sp.get('q')?.toLowerCase();

  const whereClause = search
    ? `WHERE u.is_banned = false AND LOWER(u.username) LIKE $3`
    : `WHERE u.is_banned = false`;

  const params: any[] = search
    ? [limit, offset, `%${search}%`]
    : [limit, offset];

  const [countResult, rows] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS total FROM users u WHERE u.is_banned = false${search ? ' AND LOWER(u.username) LIKE $1' : ''}`,
      search ? [`%${search}%`] : [],
    ),
    query(
      `SELECT u.id, u.username, u.avatar_url, u.streak,
         COALESCE(lc.link_count, 0)::int AS link_count,
         COALESCE(lc.like_count, 0)::int AS like_count
       FROM users u
       LEFT JOIN (
         SELECT user_id,
           COUNT(*)::int AS link_count,
           COALESCE(SUM(like_count), 0)::int AS like_count
         FROM links
         WHERE visibility = 'public'
         GROUP BY user_id
       ) lc ON lc.user_id = u.id
       ${whereClause}
       ORDER BY lc.like_count DESC NULLS LAST, u.username ASC
       LIMIT $1 OFFSET $2`,
      params,
    ),
  ]);

  const countRow = countResult[0];

  return NextResponse.json({
    users: rows,
    total: countRow?.total ?? 0,
    page,
    limit,
  });
});