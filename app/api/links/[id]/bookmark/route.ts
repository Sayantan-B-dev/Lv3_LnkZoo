import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  await sql`
    INSERT INTO saved_links (user_id, link_id)
    VALUES (${session.user_id}, ${id})
    ON CONFLICT DO NOTHING
  `;
  return NextResponse.json({ bookmarked: true });
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  await sql`
    DELETE FROM saved_links WHERE user_id = ${session.user_id} AND link_id = ${id}
  `;
  return NextResponse.json({ bookmarked: false });
});
