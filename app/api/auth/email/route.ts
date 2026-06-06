import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const PATCH = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const [existing] = await sql`
    SELECT 1 FROM users WHERE email = ${email.toLowerCase()} AND id != ${session.user_id} LIMIT 1
  `;
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  await sql`UPDATE users SET email = ${email.toLowerCase()} WHERE id = ${session.user_id}`;

  return NextResponse.json({ ok: true });
});
