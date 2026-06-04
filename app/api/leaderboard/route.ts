import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

// GET /api/leaderboard?period=week|month|all
export const GET = apiHandler(async (req: NextRequest) => {
  const period = req.nextUrl.searchParams.get('period') ?? 'week';
  const session = await getSessionFromRequest(req);

  const interval = period === 'month' ? '30 days' : '7 days';
  const hasDateFilter = period !== 'all';

  const JOIN_BASE = `LEFT JOIN links l ON l.user_id = u.id AND l.is_private = false`;
  const DATE_CLAUSE = hasDateFilter ? `AND l.created_at >= NOW() - $1::interval` : '';

  const top20 = await query(
    `SELECT u.id, u.username, u.avatar_url, u.streak,
       COUNT(DISTINCT l.id) AS link_count,
       COALESCE(SUM(l.like_count), 0)::int AS like_count,
       COALESCE(SUM(l.comment_count), 0)::int AS comment_count
     FROM users u
     ${JOIN_BASE} ${DATE_CLAUSE}
     WHERE u.is_banned = false
     GROUP BY u.id
     ORDER BY like_count DESC, comment_count DESC, link_count DESC
     LIMIT 20`,
    hasDateFilter ? [interval] : [],
  );

  let userRank = null;
  if (session) {
    const [row] = await query(
      `WITH ranked AS (
         SELECT u.id,
           ROW_NUMBER() OVER (
             ORDER BY COALESCE(SUM(l.like_count), 0) DESC,
                      COALESCE(SUM(l.comment_count), 0) DESC,
                      COUNT(DISTINCT l.id) DESC
           ) as rank
         FROM users u
         ${JOIN_BASE} ${DATE_CLAUSE}
         WHERE u.is_banned = false
         GROUP BY u.id
       )
       SELECT rank FROM ranked WHERE id = $${hasDateFilter ? 2 : 1}`,
      hasDateFilter ? [interval, session.user_id] : [session.user_id],
    );

    if (row) {
      const [userStats] = await query(
        `SELECT u.id, u.username, u.avatar_url, u.streak,
           COUNT(DISTINCT l.id) as link_count,
           COALESCE(SUM(l.like_count), 0)::int AS like_count,
           COALESCE(SUM(l.comment_count), 0)::int AS comment_count
         FROM users u
         ${JOIN_BASE} ${hasDateFilter ? 'AND l.created_at >= NOW() - $2::interval' : ''}
         WHERE u.id = $1
         GROUP BY u.id`,
        hasDateFilter ? [session.user_id, interval] : [session.user_id],
      );
      userRank = { rank: parseInt(row.rank), ...userStats };
    }
  }

  return NextResponse.json({ leaderboard: top20, userRank, period });
});