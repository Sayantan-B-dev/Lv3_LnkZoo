import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, addTags, removeTags } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Provide at least one link ID' }, { status: 400 });
  }

  const userId = session.user_id;

  const addNames: string[] = (addTags ?? [])
    .map((t: string) => t.trim().toLowerCase().replace(/^#/, ''))
    .filter(Boolean);
  const removeNames: string[] = (removeTags ?? [])
    .map((t: string) => t.trim().toLowerCase().replace(/^#/, ''))
    .filter(Boolean);

  if (addNames.length > 0) {
    for (const name of addNames) {
      const [tag] = await sql`
        INSERT INTO tags (name, normalized_name, usage_count)
        VALUES (${name}, ${name}, 1)
        ON CONFLICT (normalized_name) DO UPDATE
          SET usage_count = tags.usage_count + 1
        RETURNING id
      `;

      for (const linkId of ids) {
        await sql`
          INSERT INTO link_tags (link_id, tag_id)
          VALUES (${linkId}, ${tag.id})
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }

  if (removeNames.length > 0) {
    for (const linkId of ids) {
      await sql`
        DELETE FROM link_tags
        WHERE link_id = ${linkId}
          AND tag_id IN (
            SELECT id FROM tags WHERE normalized_name = ANY(${removeNames})
          )
      `;
    }
  }

  return NextResponse.json({ added: addNames, removed: removeNames });
});
