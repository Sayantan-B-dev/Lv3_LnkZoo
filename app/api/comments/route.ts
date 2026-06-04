import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';
import { apiHandler } from '@/lib/api-utils';

// ── GET /api/comments?link_id=xxx ───────────────────────────
export const GET = apiHandler(async (req: NextRequest) => {
  const linkId = req.nextUrl.searchParams.get('link_id');
  if (!linkId) return NextResponse.json({ error: 'link_id required' }, { status: 400 });

  const rows = await sql`
    SELECT c.id, c.parent_id, c.content, c.is_deleted, c.created_at,
           u.username, u.avatar_url
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.link_id = ${linkId}
    ORDER BY c.created_at ASC
  `;

  return NextResponse.json({ comments: rows });
});

// ── POST /api/comments ───────────────────────────────────────
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { linkId, parentId, content } = await req.json();
  if (!linkId || !content?.trim()) {
    return NextResponse.json({ error: 'linkId and content required' }, { status: 400 });
  }

  const [comment] = await sql`
    INSERT INTO comments (link_id, user_id, parent_id, content)
    VALUES (${linkId}, ${session.user_id}, ${parentId ?? null}, ${content.trim()})
    RETURNING id, content, created_at
  `;

  await sql`UPDATE links SET comment_count = comment_count + 1 WHERE id = ${linkId}`;

  // Notify link author (if different)
  const [link] = await sql`SELECT user_id, title FROM links WHERE id = ${linkId}`;
  if (link && link.user_id !== session.user_id) {
    await notificationService.create({
      user_id: link.user_id,
      actor_id: session.user_id,
      type: 'reply',
      entity_id: comment.id,
      message: `commented on your link "${link.title.slice(0, 60)}"`,
    });
  }

  // Notify parent commenter
  if (parentId) {
    const [parent] = await sql`SELECT user_id FROM comments WHERE id = ${parentId}`;
    if (parent && parent.user_id !== session.user_id) {
      await notificationService.create({
        user_id: parent.user_id,
        actor_id: session.user_id,
        type: 'reply',
        entity_id: comment.id,
        message: `replied to your comment`,
      });
    }
  }

  return NextResponse.json({ comment }, { status: 201 });
});