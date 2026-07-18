import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { username: string } }) => {
  const { username } = params;
  const session = await getSessionFromRequest(req);
  const uid = session?.user_id ?? null;

  try {
    const rows = await query(
      `SELECT DISTINCT 
         CASE 
           WHEN l.original_url LIKE 'https://www.%' THEN SUBSTRING(l.original_url FROM 'https://www\.([^/]+)')
           ELSE SUBSTRING(l.original_url FROM 'https?://([^/]+)')
         END AS domain,
         COUNT(*)::int AS count
       FROM links l
       JOIN users u ON l.user_id = u.id
       WHERE u.username = $1
         AND (l.visibility = 'public'
           OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = l.user_id))
           OR (l.visibility = 'private' AND l.user_id = $2))
       GROUP BY domain
       ORDER BY count DESC`,
      [username.toLowerCase(), uid]
    );

    return NextResponse.json({ categories: rows });
  } catch (err) {
    console.error('[GET /api/users/[username]/categories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
