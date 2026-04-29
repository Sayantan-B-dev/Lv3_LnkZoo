import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /s/[code] — short link redirect
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code;

  // Check standalone shortened_links first
  const [short] = await sql`
    SELECT original_url FROM shortened_links WHERE short_code = ${code} LIMIT 1
  `;
  if (short) {
    await sql`UPDATE shortened_links SET click_count = click_count + 1 WHERE short_code = ${code}`;
    return NextResponse.redirect(short.original_url, 301);
  }

  // Then check links table short codes
  const [link] = await sql`
    SELECT original_url FROM links WHERE short_code = ${code} LIMIT 1
  `;
  if (link) {
    await sql`UPDATE links SET click_count = click_count + 1 WHERE short_code = ${code}`;
    return NextResponse.redirect(link.original_url, 301);
  }

  return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
}
