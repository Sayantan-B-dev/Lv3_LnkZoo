import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login?error=no_code', req.url));

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) return NextResponse.redirect(new URL('/login?error=token_fail', req.url));

    // Get user info
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = await infoRes.json();

    const googleId = info.id;
    const email = info.email?.toLowerCase();
    const name = info.name ?? email?.split('@')[0];
    const avatar = info.picture;

    // Upsert user
    let user = (
      await sql`SELECT id, username, role FROM users WHERE google_id = ${googleId} LIMIT 1`
    )[0];

    if (!user) {
      // Check if email already registered (link accounts)
      const byEmail = (
        await sql`SELECT id, username, role FROM users WHERE email = ${email} LIMIT 1`
      )[0];

      if (byEmail) {
        // Link google_id to existing account
        await sql`UPDATE users SET google_id = ${googleId}, avatar_url = ${avatar} WHERE id = ${byEmail.id}`;
        user = byEmail;
      } else {
        // Generate unique username from name
        const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
        const suffix = Math.floor(Math.random() * 9000 + 1000);
        const username = `${base}${suffix}`;

        [user] = await sql`
          INSERT INTO users (username, email, google_id, avatar_url)
          VALUES (${username}, ${email}, ${googleId}, ${avatar})
          ON CONFLICT (email) DO UPDATE
            SET google_id = EXCLUDED.google_id,
                avatar_url = EXCLUDED.avatar_url
          RETURNING id, username, role
        `;
      }
    } else {
      // Refresh avatar
      await sql`UPDATE users SET avatar_url = ${avatar} WHERE id = ${user.id}`;
    }

    const token = await signToken({ user_id: user.id, username: user.username, role: user.role });
    const res = NextResponse.redirect(new URL('/', req.url));
    const opts = cookieOptions();
    res.cookies.set(opts.name, token, opts);
    return res;
  } catch (err) {
    console.error('[Google OAuth]', err);
    return NextResponse.redirect(new URL('/login?error=oauth_fail', req.url));
  }
});