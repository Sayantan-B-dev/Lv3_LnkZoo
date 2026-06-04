import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest, { params }: { params: { userId: string } }) => {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { action } = await req.json();

  if (action === 'ban') {
    await sql`UPDATE users SET is_banned = true WHERE id = ${params.userId}`;
  } else if (action === 'unban') {
    await sql`UPDATE users SET is_banned = false WHERE id = ${params.userId}`;
  } else {
    return NextResponse.json({ error: 'Invalid action. Use "ban" or "unban".' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
});
