import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { generateShortCode } from '@/lib/shortCode';

// POST /api/tools/shorten
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    const session = getSessionFromRequest(req);

    let shortCode = generateShortCode(6);
    // Ensure uniqueness
    const [exists] = await sql`SELECT 1 FROM shortened_links WHERE short_code = ${shortCode}`;
    if (exists) shortCode = generateShortCode(7);

    const [row] = await sql`
      INSERT INTO shortened_links (short_code, original_url, user_id)
      VALUES (${shortCode}, ${url}, ${session?.user_id ?? null})
      RETURNING short_code
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return NextResponse.json({
      shortCode: row.short_code,
      shortUrl: `${appUrl}/s/${row.short_code}`,
    });
  } catch (err) {
    console.error('[POST /api/tools/shorten]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
