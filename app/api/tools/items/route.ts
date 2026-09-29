import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { getSessionFromRequest } from '@/lib/auth';
import { listToolItems } from '@/services/toolItems.service';

export const dynamic = 'force-dynamic';

/**
 * Active tool output (short links, temp files, shared texts) owned by the
 * signed-in user. Guests get 401 — anonymous tool use stays untracked.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
  }

  const items = await listToolItems(session.user_id);
  return NextResponse.json({ items, serverTime: Date.now() });
});
