import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';
import { generateShortCode } from '@/lib/shortCode';
import { gamificationService } from '@/services/gamification.service';
import { resolveUrl, checkDuplicate } from '@/lib/resolveUrl';

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  const sp = req.nextUrl.searchParams;
  const tab    = sp.get('tab') ?? 'explore';
  const page   = Math.max(1, parseInt(sp.get('page') ?? '1'));
  const limit  = Math.min(200, parseInt(sp.get('limit') ?? '20'));
  const offset = (page - 1) * limit;
  const tag    = sp.get('tag');
  const topic  = sp.get('topic');
  const topicType = sp.get('topicType');
  const domain = sp.get('domain');
  const sort   = sp.get('sort') ?? 'hot';
  const query  = sp.get('q')?.toLowerCase();

  const uid = session?.user_id ?? null;

  const visFrag = sql`(
    l.visibility = 'public'
    OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = ${uid} AND followee_id = l.user_id))
    OR (l.visibility = 'private' AND l.user_id = ${uid})
  )`;

  let joinFrag = sql``;
  let whereFrag: any = visFrag;
  let orderFrag = sql`l.created_at DESC`;

  if (domain) {
    whereFrag = sql`(l.original_url LIKE ${'%//' + domain + '%'} OR l.original_url LIKE ${'%//%.' + domain + '%'}) AND ${visFrag}`;
    orderFrag = sql`l.created_at DESC`;
  } else if (query) {
    whereFrag = sql`(LOWER(l.title) LIKE ${'%' + query + '%'} OR LOWER(t.name) LIKE ${'%' + query + '%'}) AND ${visFrag}`;
    orderFrag = sql`l.like_count DESC`;
  } else if (tab === 'following' && session) {
    joinFrag = sql`JOIN follows f ON f.followee_id = l.user_id`;
    whereFrag = sql`f.follower_id = ${session.user_id} AND l.visibility IN ('public', 'followers')`;
    orderFrag = sql`l.created_at DESC`;
  } else if (tag) {
    whereFrag = sql`l.id IN (SELECT link_id FROM link_tags lt JOIN tags t ON t.id = lt.tag_id WHERE t.normalized_name = ${tag.toLowerCase()}) AND ${visFrag}`;
    orderFrag = sql`l.like_count DESC`;
  } else if (topic) {
    whereFrag = sql`l.topic_id = (SELECT id FROM topics WHERE slug = ${topic}) AND ${visFrag}`;
    orderFrag = sql`l.created_at DESC`;
  } else if (topicType) {
    whereFrag = sql`l.topic_id IN (SELECT id FROM topics WHERE parent_id = (SELECT id FROM topics WHERE slug = ${topicType})) AND ${visFrag}`;
    orderFrag = sql`l.created_at DESC`;
  } else if (sort === 'top') {
    orderFrag = sql`l.like_count DESC`;
  } else if (sort === 'oldest') {
    orderFrag = sql`l.created_at ASC`;
  } else if (sort === 'new') {
    orderFrag = sql`l.created_at DESC`;
  } else {
    orderFrag = sql`(l.like_count / POWER(EXTRACT(EPOCH FROM (NOW() - l.created_at)) / 3600.0 + 2, 1.2)) DESC`;
  }

  const [{ count: total }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM links l
    ${joinFrag}
    WHERE ${whereFrag}
  `;

  const rows = await sql`
    SELECT l.id, l.title, l.description, l.original_url, l.short_code,
           l.preview_image, l.is_anonymous, l.like_count, l.visibility,
           EXISTS (SELECT 1 FROM link_likes ll WHERE ll.link_id = l.id AND ll.user_id = ${uid}) AS liked_by_user,
           l.comment_count, l.view_count, l.created_at,
           u.username, u.avatar_url,
           ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags,
           t3.slug AS topic, t3.name AS topic_name, t3.color AS topic_color
    FROM links l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN link_tags lt ON lt.link_id = l.id
    LEFT JOIN tags t ON t.id = lt.tag_id
    LEFT JOIN topics t3 ON l.topic_id = t3.id
    ${joinFrag}
    WHERE ${whereFrag}
    GROUP BY l.id, u.username, u.avatar_url, t3.slug, t3.name, t3.color
    ORDER BY ${orderFrag}
    LIMIT ${limit} OFFSET ${offset}
  `;

  return NextResponse.json({ links: rows, total, page, limit });
});

// ── POST /api/links ─────────────────────────────────────────
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { url, title, description, tags = [], visibility: vis = 'public', isAnonymous = false, previewImage, topicId } = await req.json();

    if (!url || !title) return NextResponse.json({ error: 'URL and title required' }, { status: 400 });

    const resolvedUrl = await resolveUrl(url);

    const dup = await checkDuplicate(resolvedUrl);
    if (dup.isDuplicate) {
      return NextResponse.json({ error: `duplicate`, shortCode: dup.shortCode, title: dup.title }, { status: 409 });
    }

    let shortCode = generateShortCode(6);
    const existing = await sql`SELECT 1 FROM links WHERE short_code = ${shortCode}`;
    if (existing.length) shortCode = generateShortCode(7);

    const [link] = await sql`
      INSERT INTO links (user_id, original_url, short_code, title, description, preview_image, visibility, is_anonymous, topic_id)
      VALUES (${session.user_id}, ${resolvedUrl}, ${shortCode}, ${title}, ${description ?? null}, ${previewImage ?? null}, ${vis}, ${isAnonymous}, ${topicId ?? null})
      RETURNING id, short_code
    `;

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
