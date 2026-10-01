import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/policies';
import {
  GUEST_POOL_MAX_ITEMS,
  GUEST_POOL_PAGE_SIZE,
  listGuestToolItems,
} from '@/services/toolItems.service';

export const dynamic = 'force-dynamic';

/**
 * Admin view of the guest pool — the same unowned rows the public `/guest-pool`
 * exposes, paginated for moderation. Removal happens at
 * `DELETE /api/admin/guest-pool/[type]/[code]`.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

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
  return NextResponse.json({ items, page, limit, hasMore });
});
