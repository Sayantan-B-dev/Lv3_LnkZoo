import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';

// ── GET /api/comments?link_id=xxx ───────────────────────────
export async function GET(req: NextRequest) {
  const linkId = req.nextUrl.searchParams.get('link_id');
  if (!linkId) return NextResponse.json({ error: 'link_id required' }, { status: 400 });

  const rows = await sql`
    SELECT c.id, c.parent_id, c.content, c.upvote_count, c.is_deleted, c.created_at,
           u.username, u.avatar_url
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.link_id = ${linkId}
    ORDER BY c.created_at ASC
  `;

  return NextResponse.json({ comments: rows });
}

// ── POST /api/comments ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { linkId, parentId, content } = await req.json();
  if (!linkId || !content?.trim()) {
    return NextResponse.json({ error: 'linkId and content required' }, { status: 400 });
  }

  const [comment] = await sql`
    INSERT INTO comments (link_id, user_id, parent_id, content)
    VALUES (${linkId}, ${session.userId}, ${parentId ?? null}, ${content.trim()})
    RETURNING id, content, created_at
  `;

  await sql`UPDATE links SET comment_count = comment_count + 1 WHERE id = ${linkId}`;
  await sql`UPDATE users SET karma = karma + 1 WHERE id = ${session.userId}`;

  // Notify link author (if different)
  const [link] = await sql`SELECT user_id, title FROM links WHERE id = ${linkId}`;
  if (link && link.user_id !== session.userId) {
    await notificationService.create({
      userId: link.user_id,
      actorId: session.userId,
      type: 'reply',
      entityId: comment.id,
      message: `commented on your link "${link.title.slice(0, 60)}"`,
    });
  }

  // Notify parent commenter
  if (parentId) {
    const [parent] = await sql`SELECT user_id FROM comments WHERE id = ${parentId}`;
    if (parent && parent.user_id !== session.userId) {
      await notificationService.create({
        userId: parent.user_id,
        actorId: session.userId,
        type: 'reply',
        entityId: comment.id,
        message: `replied to your comment`,
      });
    }
  }

  return NextResponse.json({ comment }, { status: 201 });
}
