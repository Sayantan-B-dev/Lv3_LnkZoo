import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { apiHandler } from '@/lib/api-utils';

// ── GET /api/links/topics ───────────────────────────────────
// Public: returns the topic taxonomy as a tree of topic-types
// (top-level rows, parent_id IS NULL) each with their subtopics.
// Every subtopic carries a live link_count.
export const GET = apiHandler(async (_req: NextRequest) => {
  const rows = await sql`
    SELECT t.id, t.parent_id, t.slug, t.name, t.description,
           t.color, t.sort_order,
           COUNT(l.id) FILTER (WHERE l.visibility = 'public') AS link_count
    FROM topics t
    LEFT JOIN links l ON l.topic_id = t.id
    GROUP BY t.id
    ORDER BY t.name ASC
  `;

  const types = rows.filter((r: any) => r.parent_id === null);
  const tree = types.map((type: any) => {
    const children = rows
      .filter((r: any) => r.parent_id === type.id)
      .map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        color: c.color,
        link_count: Number(c.link_count),
      }));
    return {
      id: type.id,
      slug: type.slug,
      name: type.name,
      description: type.description,
      color: type.color,
      link_count: children.reduce((s: number, c: any) => s + c.link_count, 0),
      topics: children,
    };
  });

  return NextResponse.json({ types: tree });
});
