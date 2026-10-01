import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { clientIp } from '@/lib/policies';
import { rateLimit } from '@/lib/rate-limit';
import {
  GUEST_POOL_MAX_ITEMS,
  GUEST_POOL_PAGE_SIZE,
  listGuestToolItems,
} from '@/services/toolItems.service';

export const dynamic = 'force-dynamic';

/**
 * The public **guest pool** — active tool output with no owner (`user_id IS
 * NULL`), i.e. everything guests created on /tools. Open to everyone, including
 * guests, and read-only: there is no owner to scope a destroy to, so nothing
 * here can be removed early. Items still die at their own expiry.
 *
 * Paginated (`?page=1&limit=30`) so the listing stays bounded; the response
 * carries `hasMore` instead of a total count.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  if (!rateLimit(`guestpool:list:ip:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    GUEST_POOL_MAX_ITEMS,
    Math.max(
      1,
      parseInt(sp.get('limit') ?? String(GUEST_POOL_PAGE_SIZE), 10) || GUEST_POOL_PAGE_SIZE
    )
  );

  const { items, hasMore } = await listGuestToolItems({ page, limit });
  return NextResponse.json({ items, page, limit, hasMore, serverTime: Date.now() });
});
