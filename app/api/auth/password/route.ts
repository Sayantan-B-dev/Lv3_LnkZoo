import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

function isStrongPassword(pw: string): { ok: boolean; error?: string } {
  if (pw.length < 8) return { ok: false, error: 'At least 8 characters required' };
  if (!/[a-z]/.test(pw)) return { ok: false, error: 'Must include a lowercase letter' };
  if (!/[A-Z]/.test(pw)) return { ok: false, error: 'Must include an uppercase letter' };
  if (!/[0-9]/.test(pw)) return { ok: false, error: 'Must include a number' };
  if (!/[^a-zA-Z0-9]/.test(pw)) return { ok: false, error: 'Must include a special character' };
  if (pw.length > 128) return { ok: false, error: 'Password must be at most 128 characters' };
  return { ok: true };
}

export const PATCH = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
  }

  const strength = isStrongPassword(newPassword);
  if (!strength.ok) return NextResponse.json({ error: strength.error }, { status: 400 });

  const [user] = await sql`SELECT password_hash FROM users WHERE id = ${session.user_id}`;
  if (!user?.password_hash) {
    return NextResponse.json({ error: 'Password login not available for this account (try Google login)' }, { status: 403 });
  }
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${session.user_id}`;

  return NextResponse.json({ ok: true });
});
