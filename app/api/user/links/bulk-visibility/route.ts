import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const PATCH = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, visibility } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Provide at least one link ID' }, { status: 400 });
  }
  if (!['public', 'followers', 'private'].includes(visibility)) {
    return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
  }

  const result = await sql`
    UPDATE links
    SET visibility = ${visibility}, updated_at = NOW()
    WHERE id = ANY(${ids}::uuid[]) AND user_id = ${session.user_id}
    RETURNING id
  `;

  return NextResponse.json({ updated: result.length });
});
