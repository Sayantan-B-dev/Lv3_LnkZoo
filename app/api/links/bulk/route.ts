import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { generateShortCode } from '@/lib/shortCode';
import { gamificationService } from '@/services/gamification.service';
import { apiHandler } from '@/lib/api-utils';
import { decodeHtmlEntities } from '@/lib/html';

const CONCURRENCY = 5;

interface ParseResult {
  title: string;
  description: string | null;
  image: string | null;
}

async function parseUrl(url: string): Promise<ParseResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { title: url, description: null, image: null };
    const text = await res.text();
    const html = text.slice(0, 700000);

    const extractAttr = (tag: string, attr: string): string => {
      const m = tag.match(new RegExp(`${attr}=(["'])(.*?)\\1`, 'i'));
      return m ? m[2] : '';
    };

    const getMeta = (prop: string): string => {
      const metaRegex = /<meta[\s>][^>]*>/gi;
      let m: RegExpExecArray | null;
      while ((m = metaRegex.exec(html)) !== null) {
        const tag = m[0];
        const p = extractAttr(tag, 'property') || extractAttr(tag, 'name');
        if (p.toLowerCase() !== prop.toLowerCase()) continue;
        const val = extractAttr(tag, 'content');
        if (val) return val;
      }
      return '';
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = getMeta('title') || (titleMatch ? titleMatch[1].trim() : '');
    let description: string | null = getMeta('description') || '';
    const image = getMeta('image') || '';

    // Fallback: JSON-LD structured data
    if (!title) {
      const jsonMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
      if (jsonMatch) {
        try {
          const ld = JSON.parse(jsonMatch[1]);
          title = ld.name || ld.headline || ld.title || '';
          description = description || ld.description || '';
        } catch {}
      }
    }

    // Fallback: YouTube ytInitialPlayerResponse
    if (!title) {
      const ytMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
      if (ytMatch) {
        try {
          const yt = JSON.parse(ytMatch[1]);
          title = yt.videoDetails?.title || '';
          description = description || yt.videoDetails?.shortDescription || '';
        } catch {}
      }
    }

    title = title ? decodeHtmlEntities(title) : url;
    description = description ? decodeHtmlEntities(description) : null;

    return { title, description, image: image || null };
  } catch {
    return { title: url, description: null, image: null };
  }
}

async function createLink(
  url: string,
  userId: string,
  visibility: string = 'public'
): Promise<
  { success: true; id: string; shortCode: string; title: string }
  | { success: false; error: string }
> {
  try {
    const meta = await parseUrl(url);
    let shortCode = generateShortCode(6);

    const existing = await sql`SELECT 1 FROM links WHERE short_code = ${shortCode}`;
    if (existing.length) shortCode = generateShortCode(7);

    const [link] = await sql`
      INSERT INTO links (user_id, original_url, short_code, title, description, preview_image, visibility)
      VALUES (${userId}, ${url}, ${shortCode}, ${meta.title}, ${meta.description}, ${meta.image}, ${visibility})
      RETURNING id, short_code
    `;

    return { success: true, id: link.id, shortCode: link.short_code, title: meta.title };
  } catch (err) {
    console.error('[bulk] failed:', url, err);
    return { success: false, error: 'Failed to create link' };
  }
}

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { urls, visibility } = await req.json();
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'Provide at least one URL' }, { status: 400 });
  }

  const userId = session.user_id;
  const isAdmin = session.role === 'admin';
  const maxUrls = isAdmin ? urls.length : Math.min(urls.length, 10);
  const concurrency = isAdmin ? 10 : CONCURRENCY;
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
          const result = await createLink(url, userId, visibility || 'public');
          results[i] = { url, ...result };
          completed++;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'progress', processed: completed, total: batch.length }) + '\n'));
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => worker()));

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
