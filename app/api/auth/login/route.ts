import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, username, email, password_hash, avatar_url, bio, website, interests, streak, role, is_banned
      FROM users WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Use Google login for this account' }, { status: 401 });
    }

    if (user.is_banned) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({
      user_id: user.id,
      username: user.username,
      role: user.role,
    });

    const res = NextResponse.json({
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        streak: user.streak || 0,
        role: user.role
      },
    });
    const opts = cookieOptions();
    res.cookies.set(opts.name, token, opts);
    return res;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});