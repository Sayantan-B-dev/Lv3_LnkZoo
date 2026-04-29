import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, username, password_hash, is_admin, is_banned
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

    const token = signToken({
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin,
    });

    const res = NextResponse.json({
      user: { id: user.id, username: user.username, isAdmin: user.is_admin },
    });
    const opts = cookieOptions();
    res.cookies.set(opts.name, token, opts);
    return res;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
