import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { generateShortCode } from '@/lib/shortCode';
import { gamificationService } from '@/services/gamification.service';
import { suggestTags } from '@/services/autoTag.service';
import { apiHandler } from '@/lib/api-utils';

const CONCURRENCY = 5;

interface ParseResult {
  title: string;
  description: string | null;
  image: string | null;
}

async function parseUrl(url: string): Promise<ParseResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'lnkzoo-bot/1.0 (+https://lnkzoo.vercel.app)' },
      signal: AbortSignal.timeout(6000),
    });
    const html = await res.text();

    const getMeta = (prop: string): string => {
      const og = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
      if (og) return og[1];
      const name = html.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
      return name ? name[1] : '';
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta('title') || (titleMatch ? titleMatch[1].trim() : url);
    const description = getMeta('description') || null;
    const image = getMeta('image') || null;

    return { title, description, image };
  } catch {
    return { title: url, description: null, image: null };
  }
}

async function createLink(
  url: string,
  userId: string
): Promise<
  { success: true; id: string; shortCode: string; title: string; tags: string[] }
  | { success: false; error: string }
> {
  try {
    const meta = await parseUrl(url);
    let shortCode = generateShortCode(6);

    const existing = await sql`SELECT 1 FROM links WHERE short_code = ${shortCode}`;
    if (existing.length) shortCode = generateShortCode(7);

    const [link] = await sql`
      INSERT INTO links (user_id, original_url, short_code, title, description, preview_image)
      VALUES (${userId}, ${url}, ${shortCode}, ${meta.title}, ${meta.description}, ${meta.image})
      RETURNING id, short_code
    `;

    let tagNames: string[] = [];
    try {
      const suggested = await suggestTags(meta.title, meta.description || '');
      tagNames = suggested
        .map(t => t.name.toLowerCase().replace(/^#/, ''))
        .filter(Boolean)
        .slice(0, 5);

      for (const name of tagNames) {
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
    } catch (err) {
      console.error('[bulk] tag suggestion failed for:', url, err);
    }

    return { success: true, id: link.id, shortCode: link.short_code, title: meta.title, tags: tagNames };
  } catch (err) {
    console.error('[bulk] failed:', url, err);
    return { success: false, error: 'Failed to create link' };
  }
}

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { urls } = await req.json();
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'Provide at least one URL' }, { status: 400 });
  }

  const userId = session.user_id;
  const isAdmin = session.role === 'admin';
  const maxUrls = isAdmin ? urls.length : Math.min(urls.length, 10);
  const batch = urls.slice(0, maxUrls);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const results: Array<{ url: string; success: boolean; title?: string; shortCode?: string; error?: string }> = new Array(batch.length);
      const queue = batch.map((url, i) => ({ url, i }));
      let completed = 0;

      async function worker() {
        while (queue.length > 0) {
          const { url, i } = queue.shift()!;
          const result = await createLink(url, userId);
          results[i] = { url, ...result };
          completed++;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'progress', processed: completed, total: batch.length }) + '\n'));
        }
      }

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

      await gamificationService.updateStreak(userId);

      const valid = results.filter(Boolean);
      controller.enqueue(encoder.encode(JSON.stringify({
        type: 'done',
        results: valid,
        total: batch.length,
        succeeded: valid.filter(r => r.success).length,
        failed: valid.filter(r => !r.success).length,
        limitApplied: !isAdmin && urls.length > 10,
      }) + '\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
});
