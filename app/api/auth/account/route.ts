import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

const DELETE_PHRASE = 'DELETE MY ACCOUNT';

export const DELETE = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { confirmText, password } = await req.json();
  if (confirmText !== DELETE_PHRASE) {
    return NextResponse.json({ error: 'Incorrect confirmation text' }, { status: 400 });
  }

  const bcrypt = await import('bcryptjs');
  const [user] = await sql`SELECT password_hash FROM users WHERE id = ${session.user_id}`;
  if (user?.password_hash && !(await bcrypt.compare(password || '', user.password_hash))) {
    return NextResponse.json({ error: 'Password is incorrect' }, { status: 403 });
  }

  await sql`DELETE FROM users WHERE id = ${session.user_id}`;

  const res = NextResponse.json({ ok: true });
  res.cookies.set('lnkzoo_token', '', { maxAge: 0, expires: new Date(0), path: '/' });
  return res;
});
