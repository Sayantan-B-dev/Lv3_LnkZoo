import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { generateShortCode } from '@/lib/shortCode';
import { gamificationService } from '@/services/gamification.service';
import { apiHandler } from '@/lib/api-utils';
import { resolveUrl, checkDuplicate } from '@/lib/resolveUrl';
import { parseOGMetadata } from '@/services/linkParser.service';

const CONCURRENCY = 5;
const ADMIN_CONCURRENCY = 25;
const DOMAIN_MAX = 2;
const BUDGET_MS = 45_000;
const PROGRESS_BATCH = 10;

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return 'unknown'; }
}

const domainActive = new Map<string, number>();

async function acquireDomain(url: string): Promise<void> {
  const host = safeHostname(url);
  while (true) {
    const cur = domainActive.get(host) ?? 0;
    if (cur < DOMAIN_MAX) {
      domainActive.set(host, cur + 1);
      return;
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

function releaseDomain(url: string) {
  const host = safeHostname(url);
  const cur = domainActive.get(host) ?? 1;
  domainActive.set(host, Math.max(0, cur - 1));
}

async function createLink(
  url: string,
  userId: string,
  visibility: string = 'public',
  topicId: number
): Promise<
  { success: true; id: string; shortCode: string; title: string }
  | { success: false; error: string }
> {
  try {
    const resolvedUrl = await resolveUrl(url);

    const dup = await checkDuplicate(resolvedUrl);
    if (dup.isDuplicate) {
      return { success: false, error: `Duplicate - /s/${dup.shortCode}` };
    }

    const { title, description, image } = await parseOGMetadata(resolvedUrl);

    if (!title || !description) {
      const label = !title ? 'title' : 'description';
      return { success: false, error: `Could not extract ${label} from URL — add manually on single-submit` };
    }

    let shortCode = generateShortCode(6);
    for (let tries = 0; tries < 3; tries++) {
      const existing = await sql`SELECT 1 FROM links WHERE short_code = ${shortCode}`;
      if (!existing.length) break;
      shortCode = generateShortCode(6);
    }

    const [link] = await sql`
      INSERT INTO links (user_id, original_url, short_code, title, description, preview_image, visibility, topic_id)
      VALUES (${userId}, ${resolvedUrl}, ${shortCode}, ${title}, ${description}, ${image || null}, ${visibility}, ${topicId})
      RETURNING id, short_code
    `;

    return { success: true, id: link.id, shortCode: link.short_code, title };
  } catch (err) {
    console.error('[bulk] failed:', url, err);
    return { success: false, error: 'Failed to create link' };
  }
}

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { urls, visibility, topicId } = await req.json();
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'Provide at least one URL' }, { status: 400 });
  }
  if (!topicId) {
    return NextResponse.json({ error: 'topic required' }, { status: 400 });
  }

  const userId = session.user_id;
  const isAdmin = session.role === 'admin';
  const maxUrls = isAdmin ? urls.length : Math.min(urls.length, 10);
  const concurrency = isAdmin ? ADMIN_CONCURRENCY : CONCURRENCY;
  const batch = urls.slice(0, maxUrls);

  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const results: Array<{ url: string; success: boolean; title?: string; shortCode?: string; error?: string }> = new Array(batch.length);
      const queue = batch.map((url, i) => ({ url, i }));
      let completed = 0;

      function sendProgress(processed: number, total: number) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'progress', processed, total }) + '\n'));
      }

      let timedOut = false;

      async function worker() {
        while (queue.length > 0) {
          if (Date.now() - startTime >= BUDGET_MS) {
            timedOut = true;
            break;
          }

          const { url, i } = queue.shift()!;
          await acquireDomain(url);
          try {
            const result = await createLink(url, userId, visibility || 'public', topicId);
            results[i] = { url, ...result };
          } finally {
            releaseDomain(url);
          }

          completed++;

          if (completed % PROGRESS_BATCH === 0 || completed === batch.length) {
            sendProgress(completed, batch.length);
          }
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      if (timedOut) {
        for (let i = 0; i < batch.length; i++) {
          if (results[i] === undefined) {
            results[i] = { url: batch[i].url, success: false, error: 'Processing timeout — try a smaller batch' };
          }
        }
        if (completed % PROGRESS_BATCH !== 0 || completed === 0) {
          sendProgress(completed, batch.length);
        }
      }

      await gamificationService.updateStreak(userId);

      controller.enqueue(encoder.encode(JSON.stringify({
        type: 'done',
        results,
        total: batch.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        timedOut,
        limitApplied: !isAdmin && urls.length > 10,
      }) + '\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
});
