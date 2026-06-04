import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  const [users] = await sql`SELECT COUNT(*)::int AS total FROM users`;
  const [links] = await sql`SELECT COUNT(*)::int AS total FROM links`;
  const [likes] = await sql`SELECT COUNT(*)::int AS total FROM link_likes`;
  const [comments] = await sql`SELECT COUNT(*)::int AS total FROM comments`;
  const [dailyActive] = await sql`SELECT COUNT(*)::int AS total FROM users WHERE created_at > NOW() - INTERVAL '24 hours'`;
  const [dailyLinks] = await sql`SELECT COUNT(*)::int AS total FROM links WHERE created_at > NOW() - INTERVAL '24 hours'`;

  return NextResponse.json({
    totalUsers: users.total,
    totalLinks: links.total,
    totalLikes: likes.total,
    totalComments: comments.total,
    dailyActiveUsers: dailyActive.total,
    dailyLinks: dailyLinks.total,
  });
});
