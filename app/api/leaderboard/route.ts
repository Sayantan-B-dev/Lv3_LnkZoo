import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/leaderboard?period=week|month|all
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period') ?? 'week';
  const session = await getSessionFromRequest(req);

  let interval: string;
  if (period === 'month') interval = '30 days';
  else if (period === 'all') interval = '100 years';
  else interval = '7 days';

  const top20 = await sql`
    SELECT
      u.id, u.username, u.avatar_url, u.karma, u.streak,
      COUNT(DISTINCT l.id) AS link_count
    FROM users u
    LEFT JOIN links l ON l.user_id = u.id
      AND l.created_at >= NOW() - ${interval}::interval
    WHERE u.is_banned = false
    GROUP BY u.id
    ORDER BY u.karma DESC
    LIMIT 20
  `;

  let userRank = null;
  if (session) {
    const [row] = await sql`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY karma DESC) as rank
        FROM users WHERE is_banned = false
      )
      SELECT rank FROM ranked WHERE id = ${session.user_id}
    `;
    if (row) {
      const [userStats] = await sql`
        SELECT u.id, u.username, u.avatar_url, u.karma, u.streak, COUNT(DISTINCT l.id) as link_count
        FROM users u
        LEFT JOIN links l ON l.user_id = u.id AND l.created_at >= NOW() - ${interval}::interval
        WHERE u.id = ${session.user_id}
        GROUP BY u.id
      `;
      userRank = { rank: parseInt(row.rank), ...userStats };
    }
  }

  return NextResponse.json({ leaderboard: top20, userRank, period });
}
