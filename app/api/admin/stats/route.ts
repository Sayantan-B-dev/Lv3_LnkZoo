import { NextRequest, NextResponse } from 'next/server';
import sql, { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const RANGE_DAYS: Record<string, number> = { '7': 7, '30': 30, '90': 90, all: 365 };

// Gap-filled daily series for COUNT of rows in `table` by `dateCol`.
// `$1` (days) is reused; both neon + local pg shim support repeated placeholders.
function gapSeries(table: string, dateCol: string) {
  return `
    SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COALESCE(c.count, 0)::int AS count
    FROM generate_series((NOW() - make_interval(days => $1))::date, NOW()::date, '1 day') d(day)
    LEFT JOIN (
      SELECT DATE(${dateCol}) AS day, COUNT(*)::int AS count
      FROM ${table}
      WHERE ${dateCol} > NOW() - make_interval(days => $1)
      GROUP BY DATE(${dateCol})
    ) c ON c.day = d.day
    ORDER BY d.day
  `;
}

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const rangeParam = new URL(req.url).searchParams.get('range') ?? '30';
    const days = RANGE_DAYS[rangeParam] ?? 30;
    const P = [days];

    // ── Totals ──────────────────────────────────────────────
    const [users] = await sql`SELECT COUNT(*)::int AS total FROM users`;
    const [links] = await sql`SELECT COUNT(*)::int AS total FROM links`;
    const [comments] = await sql`SELECT COUNT(*)::int AS total FROM comments`;
    const [flagged] = await sql`SELECT COUNT(*)::int AS total FROM links WHERE flagged_count > 0`;
    const [bannedCount] = await sql`SELECT COUNT(*)::int AS total FROM users WHERE is_banned = true`;
    const [likesCount] = await sql`SELECT COUNT(*)::int AS total FROM link_likes`;
    const [followsCount] = await sql`SELECT COUNT(*)::int AS total FROM follows`;
    const [tagsCount] = await sql`SELECT COUNT(*)::int AS total FROM tags`;
    const [topicsCount] = await sql`SELECT COUNT(*)::int AS total FROM topics WHERE parent_id IS NOT NULL`;
    const [bookmarksCount] = await sql`SELECT COUNT(*)::int AS total FROM saved_links`;
    const [shortLinksCount] = await sql`SELECT COUNT(*)::int AS total FROM shortened_links`;
    const [engagement] = await sql`
      SELECT COALESCE(SUM(view_count),0)::int AS views,
             COALESCE(SUM(click_count),0)::int AS clicks,
             COALESCE(SUM(like_count),0)::int AS likes,
             COALESCE(SUM(comment_count),0)::int AS comments
      FROM links
    `;

    // ── Time series (gap-filled, range-scoped) ──────────────
    const userGrowth = await query(gapSeries('users', 'created_at'), P);
    const linkGrowth = await query(gapSeries('links', 'created_at'), P);
    const likesGrowth = await query(gapSeries('link_likes', 'created_at'), P);
    const bookmarksGrowth = await query(gapSeries('saved_links', 'created_at'), P);
    const viewsSeries = await query(gapSeries('link_view_events', 'created_at'), P);
    const clicksSeries = await query(gapSeries('link_click_events', 'created_at'), P);

    const dailyActivity = await query(`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
             COALESCE(p.posts, 0)::int AS posts,
             COALESCE(c.comments, 0)::int AS comments
      FROM generate_series((NOW() - make_interval(days => $1))::date, NOW()::date, '1 day') d(day)
      LEFT JOIN (
        SELECT DATE(created_at) AS day, COUNT(*)::int AS posts
        FROM links WHERE created_at > NOW() - make_interval(days => $1)
        GROUP BY DATE(created_at)
      ) p ON p.day = d.day
      LEFT JOIN (
        SELECT DATE(created_at) AS day, COUNT(*)::int AS comments
        FROM comments WHERE created_at > NOW() - make_interval(days => $1)
        GROUP BY DATE(created_at)
      ) c ON c.day = d.day
      ORDER BY d.day
    `, P);

    const dau = await query(`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COALESCE(a.cnt, 0)::int AS count
      FROM generate_series((NOW() - make_interval(days => $1))::date, NOW()::date, '1 day') d(day)
      LEFT JOIN (
        SELECT day, COUNT(DISTINCT uid)::int AS cnt FROM (
          SELECT DATE(created_at) AS day, user_id AS uid FROM links WHERE user_id IS NOT NULL AND created_at > NOW() - make_interval(days => $1)
          UNION ALL
          SELECT DATE(created_at), user_id FROM comments WHERE user_id IS NOT NULL AND created_at > NOW() - make_interval(days => $1)
          UNION ALL
          SELECT DATE(created_at), user_id FROM link_likes WHERE created_at > NOW() - make_interval(days => $1)
          UNION ALL
          SELECT DATE(created_at), user_id FROM link_view_events WHERE user_id IS NOT NULL AND created_at > NOW() - make_interval(days => $1)
        ) e GROUP BY day
      ) a ON a.day = d.day
      ORDER BY d.day
    `, P);

    const cumulativeUsers = await query(`
      WITH daily AS (SELECT DATE(created_at) AS day, COUNT(*)::int AS c FROM users GROUP BY DATE(created_at))
      SELECT to_char(s.day, 'YYYY-MM-DD') AS date,
             (SELECT COALESCE(SUM(c), 0)::int FROM daily WHERE day <= s.day) AS count
      FROM generate_series((NOW() - make_interval(days => $1))::date, NOW()::date, '1 day') s(day)
      ORDER BY s.day
    `, P);
    const cumulativeLinks = await query(`
      WITH daily AS (SELECT DATE(created_at) AS day, COUNT(*)::int AS c FROM links GROUP BY DATE(created_at))
      SELECT to_char(s.day, 'YYYY-MM-DD') AS date,
             (SELECT COALESCE(SUM(c), 0)::int FROM daily WHERE day <= s.day) AS count
      FROM generate_series((NOW() - make_interval(days => $1))::date, NOW()::date, '1 day') s(day)
      ORDER BY s.day
    `, P);

    // Fixed 7-day sums for KPI "this week" change text.
    const [usersWeek] = await sql`SELECT COUNT(*)::int AS total FROM users WHERE created_at > NOW() - INTERVAL '7 days'`;
    const [linksWeek] = await sql`SELECT COUNT(*)::int AS total FROM links WHERE created_at > NOW() - INTERVAL '7 days'`;

    // ── Distributions ───────────────────────────────────────
    const roleDist = await sql`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY count DESC`;
    const visibilityDist = await sql`
      SELECT visibility AS label, COUNT(*)::int AS count FROM links GROUP BY visibility ORDER BY count DESC
    `;
    const notificationDist = await sql`
      SELECT type AS label, COUNT(*)::int AS count FROM notifications GROUP BY type ORDER BY count DESC
    `;
    const topicDist = await sql`
      SELECT pt.name AS label, COUNT(l.id)::int AS count
      FROM topics pt
      LEFT JOIN links l ON l.topic_id = pt.id
        OR l.topic_id IN (SELECT id FROM topics WHERE parent_id = pt.id)
      WHERE pt.parent_id IS NULL
      GROUP BY pt.name
      HAVING COUNT(l.id) > 0
      ORDER BY count DESC
    `;

    // ── Top-N ───────────────────────────────────────────────
    const topTags = await sql`SELECT t.name, t.usage_count FROM tags t ORDER BY t.usage_count DESC LIMIT 10`;
    const topLinks = await sql`
      SELECT l.id, l.title, u.username,
             l.view_count, l.like_count, l.comment_count,
             (l.view_count + l.like_count * 3 + l.comment_count * 2)::int AS engagement
      FROM links l JOIN users u ON u.id = l.user_id
      ORDER BY engagement DESC LIMIT 8
    `;
    const topContributors = await sql`
      SELECT u.username, u.avatar_url,
             COUNT(DISTINCT l.id)::int AS links,
             COUNT(DISTINCT c.id)::int AS comments
      FROM users u
      LEFT JOIN links l ON l.user_id = u.id
      LEFT JOIN comments c ON c.user_id = u.id
      GROUP BY u.id, u.username, u.avatar_url
      HAVING COUNT(DISTINCT l.id) + COUNT(DISTINCT c.id) > 0
      ORDER BY (COUNT(DISTINCT l.id) + COUNT(DISTINCT c.id)) DESC
      LIMIT 8
    `;
    const streakRows = await sql`
      SELECT CASE
               WHEN streak = 0 THEN '0'
               WHEN streak BETWEEN 1 AND 2 THEN '1-2'
               WHEN streak BETWEEN 3 AND 6 THEN '3-6'
               WHEN streak BETWEEN 7 AND 13 THEN '7-13'
               WHEN streak BETWEEN 14 AND 29 THEN '14-29'
               ELSE '30+'
             END AS label,
             COUNT(*)::int AS count
      FROM users GROUP BY label
    `;
    const bucketOrder = ['0', '1-2', '3-6', '7-13', '14-29', '30+'];
    const streakBuckets = bucketOrder
      .map((label) => ({ label, count: streakRows.find((r: any) => r.label === label)?.count ?? 0 }))
      .filter((b) => b.count > 0);

    const recentFlags = await sql`
      SELECT l.id, l.title, l.original_url, l.flagged_count, u.username
      FROM links l JOIN users u ON u.id = l.user_id
      WHERE l.flagged_count > 0 ORDER BY l.flagged_count DESC LIMIT 8
    `;

    const engagementMix = [
      { label: 'Views', count: engagement.views },
      { label: 'Clicks', count: engagement.clicks },
      { label: 'Likes', count: engagement.likes },
      { label: 'Comments', count: engagement.comments },
    ].filter((d) => d.count > 0);

    return NextResponse.json({
      range: rangeParam,
      totals: {
        users: users.total, links: links.total, comments: comments.total,
        likes: likesCount.total, flagged: flagged.total, banned: bannedCount.total,
        follows: followsCount.total, tags: tagsCount.total, topics: topicsCount.total,
        bookmarks: bookmarksCount.total, shortLinks: shortLinksCount.total,
        views: engagement.views, clicks: engagement.clicks,
      },
      userGrowth, linkGrowth, likesGrowth, bookmarksGrowth, viewsSeries, clicksSeries,
      dailyActivity, dau, cumulativeUsers, cumulativeLinks,
      userGrowthWeekly: [{ date: '', count: usersWeek.total }],
      linkGrowthWeekly: [{ date: '', count: linksWeek.total }],
      roleDist, visibilityDist, notificationDist, topicDist, engagementMix,
      topTags, topLinks, topContributors, streakBuckets, recentFlags,
    });
  } catch (err) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
