import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  const [[users], [links], [likes], [comments], [dailyActive], [dailyLinks]] = await Promise.all([
    sql`SELECT COUNT(*)::int AS total FROM users`,
    sql`SELECT COUNT(*)::int AS total FROM links`,
    sql`SELECT COUNT(*)::int AS total FROM link_likes`,
    sql`SELECT COUNT(*)::int AS total FROM comments`,
    sql`SELECT COUNT(*)::int AS total FROM users WHERE created_at > NOW() - INTERVAL '24 hours'`,
    sql`SELECT COUNT(*)::int AS total FROM links WHERE created_at > NOW() - INTERVAL '24 hours'`,
  ]);

  return NextResponse.json({
    totalUsers: users.total,
    totalLinks: links.total,
    totalLikes: likes.total,
    totalComments: comments.total,
    dailyActiveUsers: dailyActive.total,
    dailyLinks: dailyLinks.total,
  });
});
