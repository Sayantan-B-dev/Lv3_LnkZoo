import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, interests = [] } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email and password required' }, { status: 400 });
    }

    if (!/^[a-z0-9_]{3,30}$/i.test(username)) {
      return NextResponse.json({ error: 'Username: 3–30 chars, letters/numbers/underscore' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await sql`
      SELECT 1 FROM users
      WHERE username = ${username.toLowerCase()} OR email = ${email.toLowerCase()}
      LIMIT 1
    `;
    if (existing.length) {
      return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);

    const [user] = await sql`
      INSERT INTO users (username, email, password_hash, interests)
      VALUES (${username.toLowerCase()}, ${email.toLowerCase()}, ${hash}, ${interests})
      RETURNING id, username, role
    `;

    const token = await signToken({ user_id: user.id, username: user.username, role: user.role });

    const res = NextResponse.json(
      { user: { 
          id: user.id, 
          username: user.username, 
          email: email.toLowerCase(),
          role: user.role,
          streak: 0
        } 
      },
      { status: 201 }
    );
    const opts = cookieOptions();
    res.cookies.set(opts.name, token, opts);
    return res;
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
