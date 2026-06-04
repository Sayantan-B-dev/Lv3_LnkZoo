import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const [users] = await sql`SELECT COUNT(*)::int AS total FROM users`;
    const [links] = await sql`SELECT COUNT(*)::int AS total FROM links`;
    const [comments] = await sql`SELECT COUNT(*)::int AS total FROM comments`;
    const [flagged] = await sql`SELECT COUNT(*)::int AS total FROM links WHERE flagged_count > 0`;

    const userGrowth = await sql`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS count
      FROM users WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date
    `;

    const linkGrowth = await sql`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS count
      FROM links WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date
    `;

    const roleDist = await sql`
      SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY count DESC
    `;

    const topTags = await sql`
      SELECT t.name, t.usage_count FROM tags t ORDER BY t.usage_count DESC LIMIT 10
    `;

    const dailyActivity = await sql`
      WITH link_dates AS (
        SELECT DATE(created_at) AS date, COUNT(*)::int AS posts
        FROM links WHERE created_at > NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
      ), comment_dates AS (
        SELECT DATE(created_at) AS date, COUNT(*)::int AS comments
        FROM comments WHERE created_at > NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
      )
      SELECT COALESCE(l.date, c.date) AS date,
             COALESCE(l.posts, 0) AS posts,
             COALESCE(c.comments, 0) AS comments
      FROM link_dates l
      FULL JOIN comment_dates c ON l.date = c.date
      ORDER BY date
    `;

    const recentFlags = await sql`
      SELECT l.id, l.title, l.original_url, l.flagged_count, u.username
      FROM links l JOIN users u ON u.id = l.user_id
      WHERE l.flagged_count > 0 ORDER BY l.flagged_count DESC LIMIT 5
    `;

    const [bannedCount] = await sql`
      SELECT COUNT(*)::int AS total FROM users WHERE is_banned = true
    `;
    const [likesCount] = await sql`SELECT COUNT(*)::int AS total FROM link_likes`;

    const userGrowthWeekly = await sql`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS count
      FROM users WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY date
    `;
    const linkGrowthWeekly = await sql`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS count
      FROM links WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY date
    `;

    return NextResponse.json({
      totals: { users: users.total, links: links.total, comments: comments.total, likes: likesCount.total, flagged: flagged.total, banned: bannedCount.total },
      userGrowth, linkGrowth, roleDist, topTags, dailyActivity, recentFlags, userGrowthWeekly, linkGrowthWeekly,
    });
  } catch (err) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
