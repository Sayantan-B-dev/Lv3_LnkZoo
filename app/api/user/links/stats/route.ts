import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user_id;

  const [stats] = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE visibility = 'public')::int AS public_count,
      COUNT(*) FILTER (WHERE visibility = 'followers')::int AS followers_count,
      COUNT(*) FILTER (WHERE visibility = 'private')::int AS private_count,
      COALESCE(SUM(like_count), 0)::int AS total_likes,
      COALESCE(SUM(view_count), 0)::int AS total_views,
      COALESCE(SUM(comment_count), 0)::int AS total_comments,
      COALESCE(SUM(click_count), 0)::int AS total_clicks,
      COALESCE(AVG(like_count)::numeric(10,2), 0)::float AS avg_likes
    FROM links
    WHERE user_id = ${userId}
  `;

  return NextResponse.json({ stats });
});
