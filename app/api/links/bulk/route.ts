import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { generateShortCode } from '@/lib/shortCode';
import { gamificationService } from '@/services/gamification.service';
import { apiHandler } from '@/lib/api-utils';
import { resolveUrl, checkDuplicate } from '@/lib/resolveUrl';
import { parseOGMetadata } from '@/services/linkParser.service';

const CONCURRENCY = 5;

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

    const existing = await sql`SELECT 1 FROM links WHERE short_code = ${shortCode}`;
    if (existing.length) shortCode = generateShortCode(7);

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
          const result = await createLink(url, userId, visibility || 'public', topicId);
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
