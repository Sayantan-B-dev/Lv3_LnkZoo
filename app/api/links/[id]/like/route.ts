import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';
import { apiHandler } from '@/lib/api-utils';

// POST /api/links/[id]/like toggles a logged-in user's like.
export const POST = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const linkId = params.id;

  const deleted = await sql`
    DELETE FROM link_likes WHERE user_id = ${session.user_id} AND link_id = ${linkId}
    RETURNING 1 AS was_liked
  `;

  const liked = deleted.length === 0;

  if (liked) {
    await sql`INSERT INTO link_likes (user_id, link_id) VALUES (${session.user_id}, ${linkId})`;
  }

  const [updated] = liked
    ? await sql`UPDATE links SET like_count = like_count + 1 WHERE id = ${linkId} RETURNING like_count`
    : await sql`UPDATE links SET like_count = GREATEST(like_count - 1, 0) WHERE id = ${linkId} RETURNING like_count`;

  if (liked) {
    const [link] = await sql`SELECT user_id, title FROM links WHERE id = ${linkId}`;
    if (link && link.user_id !== session.user_id) {
      notificationService.create({
        user_id: link.user_id,
        actor_id: session.user_id,
        type: 'like',
        entity_id: linkId,
        message: `liked your link "${link.title.slice(0, 60)}"`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ liked, like_count: updated.like_count });
});