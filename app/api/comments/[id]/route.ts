import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

// DELETE /api/comments/[id]
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [comment] = await sql`SELECT user_id, link_id FROM comments WHERE id = ${params.id}`;
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (comment.user_id !== session.user_id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete or hard delete? User said "remove", I'll do hard delete but update count
    await sql`DELETE FROM comments WHERE id = ${params.id}`;
    await sql`UPDATE links SET comment_count = comment_count - 1 WHERE id = ${comment.link_id}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/comments/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PATCH /api/comments/[id]
export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const [comment] = await sql`SELECT user_id FROM comments WHERE id = ${params.id}`;
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (comment.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updated] = await sql`
      UPDATE comments SET content = ${content.trim()} WHERE id = ${params.id} RETURNING *
    `;

    return NextResponse.json({ comment: updated });
  } catch (err) {
    console.error('[PATCH /api/comments/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});