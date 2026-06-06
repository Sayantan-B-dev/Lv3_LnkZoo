import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';

// POST /api/tools/parse — fetch OG metadata from a URL
export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    const res = await fetch(url, {
      headers: { 'User-Agent': 'linkzoo-bot/1.0 (+https://lnkzoo.vercel.app)' },
      signal: AbortSignal.timeout(6000),
    });

    const html = await res.text();

    const getMeta = (prop: string): string => {
      const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
      if (ogMatch) return ogMatch[1];
      const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
      return nameMatch ? nameMatch[1] : '';
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const title = getMeta('title') || (titleMatch ? titleMatch[1].trim() : '');
    const description = getMeta('description');
    const image = getMeta('image');
    const domain = new URL(url).hostname;

    return NextResponse.json({ title, description, image, domain, url });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to parse URL', detail: err?.message }, { status: 422 });
  }
});