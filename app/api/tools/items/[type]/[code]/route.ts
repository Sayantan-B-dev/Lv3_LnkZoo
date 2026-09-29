import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { getSessionFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { destroyToolItem, isToolItemType } from '@/services/toolItems.service';

export const dynamic = 'force-dynamic';

/**
 * Destroy one item from the owner's profile: a temp file also removes its
 * Cloudinary asset, a shared text drops the row, a short link stops resolving.
 */
export const DELETE = apiHandler(
  async (req: NextRequest, { params }: { params: { type: string; code: string } }) => {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }

    const { type, code } = params;
    if (!isToolItemType(type)) {
      return NextResponse.json({ error: 'Unknown tool type' }, { status: 400 });
    }

    if (!rateLimit(`toolitem:destroy:${session.user_id}`, 30, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests, slow down' },
        { status: 429 }
      );
    }

    const destroyed = await destroyToolItem(session.user_id, type, code);
    if (!destroyed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }
);
