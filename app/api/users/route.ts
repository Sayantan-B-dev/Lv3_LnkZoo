import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
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

  const [countRow] = await query(
    `SELECT COUNT(*)::int AS total FROM users u WHERE u.is_banned = false${search ? ' AND LOWER(u.username) LIKE $1' : ''}`,
    search ? [`%${search}%`] : [],
  );

  const rows = await query(
    `SELECT u.id, u.username, u.avatar_url, u.streak,
       COALESCE(lc.link_count, 0)::int AS link_count,
       COALESCE(lc.like_count, 0)::int AS like_count
     FROM users u
     LEFT JOIN (
       SELECT user_id,
         COUNT(*)::int AS link_count,
         COALESCE(SUM(like_count), 0)::int AS like_count
       FROM links
       WHERE is_private = false
       GROUP BY user_id
     ) lc ON lc.user_id = u.id
     ${whereClause}
     ORDER BY lc.like_count DESC NULLS LAST, u.username ASC
     LIMIT $1 OFFSET $2`,
    params,
  );

  return NextResponse.json({
    users: rows,
    total: countRow?.total ?? 0,
    page,
    limit,
  });
}
