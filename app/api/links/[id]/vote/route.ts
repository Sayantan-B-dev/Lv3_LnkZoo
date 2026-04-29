import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';

// ── POST /api/links/[id]/vote ────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { vote } = await req.json(); // 1 or -1
  if (vote !== 1 && vote !== -1) {
    return NextResponse.json({ error: 'vote must be 1 or -1' }, { status: 400 });
  }

  const linkId = params.id;

  // Check existing vote
  const [existing] = await sql`
    SELECT vote FROM link_votes WHERE user_id = ${session.user_id} AND link_id = ${linkId}
  `;

  if (existing) {
    if (existing.vote === vote) {
      // Undo vote
      await sql`DELETE FROM link_votes WHERE user_id = ${session.user_id} AND link_id = ${linkId}`;
      if (vote === 1) {
        await sql`UPDATE links SET upvote_count = upvote_count - 1 WHERE id = ${linkId}`;
        await sql`UPDATE users SET karma = karma - 2 WHERE id = (SELECT user_id FROM links WHERE id = ${linkId})`;
      } else {
        await sql`UPDATE links SET downvote_count = downvote_count - 1 WHERE id = ${linkId}`;
      }
      return NextResponse.json({ action: 'removed' });
    } else {
      // Switch vote
      await sql`UPDATE link_votes SET vote = ${vote} WHERE user_id = ${session.user_id} AND link_id = ${linkId}`;
      if (vote === 1) {
        await sql`UPDATE links SET upvote_count = upvote_count + 1, downvote_count = downvote_count - 1 WHERE id = ${linkId}`;
      } else {
        await sql`UPDATE links SET upvote_count = upvote_count - 1, downvote_count = downvote_count + 1 WHERE id = ${linkId}`;
      }
      return NextResponse.json({ action: 'switched' });
    }
  }

  // New vote
  await sql`INSERT INTO link_votes (user_id, link_id, vote) VALUES (${session.user_id}, ${linkId}, ${vote})`;
  if (vote === 1) {
    await sql`UPDATE links SET upvote_count = upvote_count + 1 WHERE id = ${linkId}`;
    // Karma to author + notification
    const [link] = await sql`SELECT user_id, title FROM links WHERE id = ${linkId}`;
    if (link && link.user_id !== session.user_id) {
      await sql`UPDATE users SET karma = karma + 2 WHERE id = ${link.user_id}`;
      await notificationService.create({
        user_id: link.user_id,
        actor_id: session.user_id,
        type: 'upvote',
        entity_id: linkId,
        message: `upvoted your link "${link.title.slice(0, 60)}"`,
      });
    }
  } else {
    await sql`UPDATE links SET downvote_count = downvote_count + 1 WHERE id = ${linkId}`;
  }

  return NextResponse.json({ action: 'added' });
}
