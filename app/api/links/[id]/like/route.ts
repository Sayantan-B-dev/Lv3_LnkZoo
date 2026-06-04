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

  const [existing] = await sql`
    SELECT 1 FROM link_likes WHERE user_id = ${session.user_id} AND link_id = ${linkId}
  `;

  if (existing) {
    await sql`DELETE FROM link_likes WHERE user_id = ${session.user_id} AND link_id = ${linkId}`;
    const [link] = await sql`
      UPDATE links
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = ${linkId}
      RETURNING like_count
    `;
    return NextResponse.json({ liked: false, like_count: link?.like_count ?? 0 });
  }

  const [link] = await sql`SELECT user_id, title FROM links WHERE id = ${linkId}`;
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`INSERT INTO link_likes (user_id, link_id) VALUES (${session.user_id}, ${linkId})`;
  const [updated] = await sql`
    UPDATE links
    SET like_count = like_count + 1
    WHERE id = ${linkId}
    RETURNING like_count
  `;

  if (link.user_id !== session.user_id) {
    await notificationService.create({
      user_id: link.user_id,
      actor_id: session.user_id,
      type: 'like',
      entity_id: linkId,
      message: `liked your link "${link.title.slice(0, 60)}"`,
    });
  }

  return NextResponse.json({ liked: true, like_count: updated.like_count });
});