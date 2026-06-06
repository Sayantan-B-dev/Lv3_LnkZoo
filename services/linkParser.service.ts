export interface ParseResult {
  title: string;
  description: string;
  image: string;
  domain: string;
}

function extractMetaAttribute(html: string, property: string, attr: string): string {
  const propPattern = new RegExp(`(?:property|name)=["']${property}["']`, 'i');
  const attrPattern = new RegExp(`${attr}=["']([^"']+)["']`, 'i');

  const metaRegex = /<meta[\s>][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];
    const propMatch = tag.match(propPattern);
    if (!propMatch) continue;
    const valMatch = tag.match(attrPattern);
    if (valMatch) return valMatch[1];
  }
  return '';
}

export async function parseOGMetadata(url: string): Promise<ParseResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'lnkzoo-bot/1.0 (+https://lnkzoo.vercel.app)' },
    signal: AbortSignal.timeout(6000),
  });

  const html = await res.text();

  const title =
    extractMetaAttribute(html, 'og:title', 'content') ||
    extractMetaAttribute(html, 'twitter:title', 'content') ||
    extractMetaAttribute(html, 'title', 'content') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    '';

  const description =
    extractMetaAttribute(html, 'og:description', 'content') ||
    extractMetaAttribute(html, 'twitter:description', 'content') ||
    extractMetaAttribute(html, 'description', 'content') ||
    '';

  const image =
    extractMetaAttribute(html, 'og:image', 'content') ||
    extractMetaAttribute(html, 'twitter:image', 'content') ||
    '';

  const domain = new URL(url).hostname;

  return { title, description, image, domain };
}
