import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';
import { generateShortCode } from '@/lib/shortCode';
import { gamificationService } from '@/services/gamification.service';

// ── GET /api/links ─────────────────────────────────────────
// ?tab=following|explore|recommended  &page=1  &limit=20  &tag=xyz  &sort=hot|new|top
export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  const sp = req.nextUrl.searchParams;
  const tab    = sp.get('tab') ?? 'explore';
  const page   = Math.max(1, parseInt(sp.get('page') ?? '1'));
  const limit  = Math.min(50, parseInt(sp.get('limit') ?? '20'));
  const offset = (page - 1) * limit;
  const tag    = sp.get('tag');
  const sort   = sp.get('sort') ?? 'hot';
  const query  = sp.get('q')?.toLowerCase();

  let rows: any[];

  if (query) {
    rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count,
             EXISTS (
               SELECT 1 FROM link_likes ll
               WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? null}
             ) AS liked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE (LOWER(l.title) LIKE ${'%' + query + '%'} OR LOWER(t.name) LIKE ${'%' + query + '%'})
        AND l.is_private = false
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY l.like_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (tab === 'following' && session) {
    rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count,
             EXISTS (
               SELECT 1 FROM link_likes ll
               WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? null}
             ) AS liked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      JOIN follows f ON f.followee_id = l.user_id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE f.follower_id = ${session.user_id}
        AND l.is_private = false
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (tag) {
    rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count,
             EXISTS (
               SELECT 1 FROM link_likes ll
               WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? null}
             ) AS liked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t2.name) FILTER (WHERE t2.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      JOIN link_tags lt ON lt.link_id = l.id
      JOIN tags t ON t.id = lt.tag_id AND t.normalized_name = ${tag.toLowerCase()}
      LEFT JOIN link_tags lt2 ON lt2.link_id = l.id
      LEFT JOIN tags t2 ON t2.id = lt2.tag_id
      WHERE l.is_private = false
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY l.like_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (sort === 'top') {
    rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count,
             EXISTS (
               SELECT 1 FROM link_likes ll
               WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? null}
             ) AS liked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE l.is_private = false
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY l.like_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (sort === 'new') {
    rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count,
             EXISTS (
               SELECT 1 FROM link_likes ll
               WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? null}
             ) AS liked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
      FROM links l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE l.is_private = false
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    // "hot" — likes with recency decay
    rows = await sql`
      SELECT l.id, l.title, l.description, l.original_url, l.short_code,
             l.preview_image, l.is_anonymous, l.like_count,
             EXISTS (
               SELECT 1 FROM link_likes ll
               WHERE ll.link_id = l.id AND ll.user_id = ${session?.user_id ?? null}
             ) AS liked_by_user,
             l.comment_count, l.view_count, l.created_at,
             u.username, u.avatar_url,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags,
             (l.like_count / POWER(EXTRACT(EPOCH FROM (NOW() - l.created_at)) / 3600.0 + 2, 1.2)) AS hot_score
      FROM links l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN link_tags lt ON lt.link_id = l.id
      LEFT JOIN tags t ON t.id = lt.tag_id
      WHERE l.is_private = false
      GROUP BY l.id, u.username, u.avatar_url
      ORDER BY hot_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return NextResponse.json({ links: rows, page, limit });
});

// ── POST /api/links ─────────────────────────────────────────
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { url, title, description, tags = [], isPrivate = false, isAnonymous = false, previewImage } = await req.json();

    if (!url || !title) return NextResponse.json({ error: 'URL and title required' }, { status: 400 });

    // Generate unique short code
    let shortCode = generateShortCode(6);
    const existing = await sql`SELECT 1 FROM links WHERE short_code = ${shortCode}`;
    if (existing.length) shortCode = generateShortCode(7);

    const [link] = await sql`
      INSERT INTO links (user_id, original_url, short_code, title, description, preview_image, is_private, is_anonymous)
      VALUES (${session.user_id}, ${url}, ${shortCode}, ${title}, ${description ?? null}, ${previewImage ?? null}, ${isPrivate}, ${isAnonymous})
      RETURNING id, short_code
    `;

    // Upsert tags and associate
    for (const rawTag of tags.slice(0, 5)) {
      const name = String(rawTag).trim().toLowerCase().replace(/^#/, '');
      if (!name) continue;

      const [tag] = await sql`
        INSERT INTO tags (name, normalized_name, usage_count)
        VALUES (${name}, ${name}, 1)
        ON CONFLICT (normalized_name) DO UPDATE
          SET usage_count = tags.usage_count + 1
        RETURNING id
      `;

      await sql`
        INSERT INTO link_tags (link_id, tag_id) VALUES (${link.id}, ${tag.id})
        ON CONFLICT DO NOTHING
      `;
    }

    await gamificationService.updateStreak(session.user_id);

    return NextResponse.json({ link: { id: link.id, shortCode: link.short_code } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/links]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});