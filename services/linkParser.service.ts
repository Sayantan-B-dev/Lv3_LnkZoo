export interface ParseResult {
  title: string;
  description: string;
  image: string;
  domain: string;
}

export async function parseOGMetadata(url: string): Promise<ParseResult> {
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

  return { title, description, image, domain };
}
