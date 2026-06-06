import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await sql`
    UPDATE links SET flagged_count = flagged_count + 1 WHERE id = ${params.id}
  `;

  const [link] = await sql`SELECT user_id, title FROM links WHERE id = ${params.id}`;
  if (link && link.user_id !== session.user_id) {
    await notificationService.create({
      user_id: link.user_id,
      actor_id: session.user_id,
      type: 'mention',
      entity_id: params.id,
      message: `flagged your link "${link.title.slice(0, 60)}"`,
    });
  }

  const admins = await sql`SELECT id FROM users WHERE role = 'admin'`;
  for (const admin of admins) {
    if (admin.id !== session.user_id) {
      await notificationService.create({
        user_id: admin.id,
        actor_id: session.user_id,
      type: 'flag',
        entity_id: params.id,
        message: `flagged a link "${link?.title?.slice(0, 60) ?? ''}"`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
});