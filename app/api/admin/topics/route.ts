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

// ── GET /api/admin/topics ───────────────────────────────────
// Admin: flat list of every topic (types + subtopics) for management.
export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const rows = await sql`
    SELECT t.id, t.parent_id, t.slug, t.name, t.description,
           t.color, t.sort_order,
           COUNT(l.id) AS link_count
    FROM topics t
    LEFT JOIN links l ON l.topic_id = t.id
    GROUP BY t.id
    ORDER BY t.name ASC
  `;

  return NextResponse.json({ topics: rows });
});

// ── POST /api/admin/topics ──────────────────────────────────
// Admin: create a topic-type (parentId null) or a subtopic.
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { name, description, color, parentId } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json({ error: 'Name must contain letters or numbers' }, { status: 400 });
    }

    const parent = parentId ?? null;
    if (parent !== null) {
      const [p] = await sql`SELECT id, parent_id FROM topics WHERE id = ${parent}`;
      if (!p) return NextResponse.json({ error: 'Parent topic not found' }, { status: 400 });
      if (p.parent_id !== null) {
        return NextResponse.json({ error: 'Cannot nest under a subtopic (max 2 levels)' }, { status: 400 });
      }
    }

    const [existing] = await sql`SELECT id FROM topics WHERE slug = ${slug}`;
    if (existing) {
      return NextResponse.json({ error: 'A topic with this slug already exists' }, { status: 409 });
    }

    const [topic] = await sql`
      INSERT INTO topics (parent_id, slug, name, description, color)
      VALUES (${parent}, ${slug}, ${name.trim()}, ${description ?? null}, ${color ?? null})
      RETURNING id, parent_id, slug, name, description, color, sort_order
    `;

    return NextResponse.json({ topic }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/topics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
