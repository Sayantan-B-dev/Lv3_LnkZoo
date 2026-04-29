import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// ── GET /api/links/[id] ─────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.is_anonymous, l.is_private,
           l.upvote_count, l.downvote_count, l.comment_count, l.view_count, l.click_count,
           l.flagged_count, l.created_at, l.updated_at,
           u.username, u.avatar_url,
           ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
    FROM links l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    WHERE l.id = ${id}
    GROUP BY l.id, u.username, u.avatar_url
  `;

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Increment view count (fire and forget)
  sql`UPDATE links SET view_count = view_count + 1 WHERE id = ${id}`.catch(() => {});

  return NextResponse.json({ link: rows[0] });
}

// ── DELETE /api/links/[id] ──────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [link] = await sql`SELECT user_id FROM links WHERE id = ${params.id}`;
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (link.user_id !== session.user_id && !session.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await sql`DELETE FROM links WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}

// ── PATCH /api/links/[id] — flag ────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();
  if (action === 'flag') {
    await sql`UPDATE links SET flagged_count = flagged_count + 1 WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
