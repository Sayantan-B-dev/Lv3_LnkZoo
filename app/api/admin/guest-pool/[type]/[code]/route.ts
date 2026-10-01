import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/policies';
import { rateLimit } from '@/lib/rate-limit';
import { destroyGuestToolItem, isToolItemType } from '@/services/toolItems.service';

export const dynamic = 'force-dynamic';

/**
 * Admin: remove one guest pool entry. Owner-less by construction — the service
 * carries `user_id IS NULL` in every statement, so a signed-in user's tool
 * output can never be destroyed from here. Killing a file also destroys its
 * Cloudinary asset; a short link stops resolving; a shared text drops its row.
 */
export const DELETE = apiHandler(
  async (req: NextRequest, { params }: { params: { type: string; code: string } }) => {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.response;

    const { type, code } = params;
    if (!isToolItemType(type)) {
      return NextResponse.json({ error: 'Unknown tool type' }, { status: 400 });
    }

    if (!rateLimit(`guestpool:admin:destroy:${guard.session.user_id}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
    }

    const destroyed = await destroyGuestToolItem(type, code);
    if (!destroyed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }
);
