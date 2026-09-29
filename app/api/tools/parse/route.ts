import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { clientIp } from '@/lib/policies';
import { rateLimit } from '@/lib/rate-limit';
import { checkRemoteUrl } from '@/lib/urlSafety';
import { parseOGMetadata } from '@/services/linkParser.service';
import { suggestTags } from '@/services/autoTag.service';

export const dynamic = 'force-dynamic';

/** Anonymous but outbound-request-making, so it needs its own ceiling. */
const PARSE_WINDOW_MS = 60 * 1000;
const PARSE_MAX_PER_IP = 20;

/**
 * Public (no session required) — the submit and bulk pages call it before the
 * visitor has committed to anything. The URL is checked against the SSRF guard
 * here so a blocked host gets a clear 400 instead of a silent fallback title,
 * and the per-IP limit stops it being used as an open fetch proxy.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  if (
    !rateLimit(`tools:parse:ip:${clientIp(req)}`, PARSE_MAX_PER_IP, PARSE_WINDOW_MS)
  ) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  const check = checkRemoteUrl(url);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  try {
    const { title, description, image, domain } = await parseOGMetadata(url);
    const tags = await suggestTags(title, description);

    return NextResponse.json({ title, description, image, domain, url, suggestedTags: tags });
  } catch {
    // Never hand the raw failure back: it can name internal hosts or DNS errors.
    return NextResponse.json({ error: 'Could not read that page' }, { status: 422 });
  }
});
