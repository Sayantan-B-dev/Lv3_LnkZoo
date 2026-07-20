import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── PATCH /api/admin/topics/[id] ────────────────────────────
// Admin: rename / edit description / color. Slug follows name.
export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { name, description, color } = await req.json();

    const [current] = await sql`SELECT id, slug, name FROM topics WHERE id = ${params.id}`;
    if (!current) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    let slug = current.slug;
    if (name && typeof name === 'string' && name.trim() && name.trim() !== current.name) {
      slug = slugify(name);
      if (!slug) {
        return NextResponse.json({ error: 'Name must contain letters or numbers' }, { status: 400 });
      }
      const [dupe] = await sql`SELECT id FROM topics WHERE slug = ${slug} AND id <> ${params.id}`;
      if (dupe) {
        return NextResponse.json({ error: 'A topic with this slug already exists' }, { status: 409 });
      }
    }

    const [topic] = await sql`
      UPDATE topics SET
        name = ${name?.trim() ?? current.name},
        slug = ${slug},
        description = ${description ?? null},
        color = ${color ?? null}
      WHERE id = ${params.id}
      RETURNING id, parent_id, slug, name, description, color, sort_order
    `;

    return NextResponse.json({ topic });
  } catch (err) {
    console.error('[PATCH /api/admin/topics/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// ── DELETE /api/admin/topics/[id] ───────────────────────────
// Admin: delete a topic. Links' topic_id is nulled via FK
// (ON DELETE SET NULL). Deleting a type cascades to its subtopics.
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const [existing] = await sql`SELECT id, parent_id FROM topics WHERE id = ${params.id}`;
    if (!existing) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    if (existing.parent_id === null) {
      await sql`DELETE FROM topics WHERE parent_id = ${params.id}`;
    }
    await sql`DELETE FROM topics WHERE id = ${params.id}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/topics/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
