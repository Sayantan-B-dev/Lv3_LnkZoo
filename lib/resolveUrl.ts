import sql from '@/lib/db';

const SHORT_URL_PATTERN = /\/(s\/[a-zA-Z0-9]+)(?:\?|$|#)/;

export async function resolveUrl(input: string): Promise<string> {
  const match = input.match(SHORT_URL_PATTERN);
  if (!match) return input;

  const code = match[1].replace('s/', '');
  const [link] = await sql`
    SELECT original_url FROM links WHERE short_code = ${code} LIMIT 1
  `;
  if (link) return link.original_url;

  const [short] = await sql`
    SELECT original_url FROM shortened_links WHERE short_code = ${code} AND created_at > NOW() - INTERVAL '1 day' LIMIT 1
  `;
  if (short) return short.original_url;

  return input;
}

export async function checkDuplicate(url: string): Promise<{ isDuplicate: boolean; shortCode?: string; title?: string }> {
  const [existing] = await sql`
    SELECT short_code, title FROM links WHERE original_url = ${url} LIMIT 1
  `;
  if (existing) {
    return { isDuplicate: true, shortCode: existing.short_code, title: existing.title };
  }
  return { isDuplicate: false };
}
