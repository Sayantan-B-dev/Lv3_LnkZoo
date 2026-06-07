import { decodeHtmlEntities } from '@/lib/html';
import { fetchOEmbed, fallbackTitle } from '@/lib/platform';

export interface ParseResult {
  title: string;
  description: string;
  image: string;
  domain: string;
}

function extractAttrValue(tag: string, attr: string): string {
  const m = tag.match(new RegExp(`${attr}=(["'])(.*?)\\1`, 'i'));
  return m ? m[2] : '';
}

function extractMetaAttribute(html: string, property: string): string {
  const metaRegex = /<meta[\s>][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];
    const propVal = extractAttrValue(tag, 'property') || extractAttrValue(tag, 'name');
    if (propVal.toLowerCase() !== property.toLowerCase()) continue;
    const val = extractAttrValue(tag, 'content');
    if (val) return val;
  }
  return '';
}

export async function parseOGMetadata(url: string): Promise<ParseResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const domain = new URL(url).hostname;
      return { title: url, description: '', image: '', domain };
    }
    const text = await res.text();
    const html = text.slice(0, 700000);

    let title =
      extractMetaAttribute(html, 'og:title') ||
      extractMetaAttribute(html, 'twitter:title') ||
      extractMetaAttribute(html, 'title') ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      '';

    let description =
      extractMetaAttribute(html, 'og:description') ||
      extractMetaAttribute(html, 'twitter:description') ||
      extractMetaAttribute(html, 'description') ||
      '';

    const image =
      extractMetaAttribute(html, 'og:image') ||
      extractMetaAttribute(html, 'twitter:image') ||
      '';

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

    const domain = new URL(url).hostname;

    let finalTitle = title || '';
    let finalDesc = description || '';

    // Platform-specific oEmbed fallback for JS-rendered sites
    if (!finalTitle) {
      const oembed = await fetchOEmbed(url);
      if (oembed) {
        finalTitle = oembed.title;
        finalDesc = finalDesc || oembed.description;
      }
    }

    // Fallback to a readable platform name
    if (!finalTitle) {
      finalTitle = fallbackTitle(url) || url;
    }

    return { title: decodeHtmlEntities(finalTitle), description: finalDesc ? decodeHtmlEntities(finalDesc) : '', image, domain };
  } catch {
    const domain = new URL(url).hostname;
    return { title: url, description: '', image: '', domain };
  }
}
