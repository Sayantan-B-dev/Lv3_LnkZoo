import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { role } = await req.json();
    if (!['user', 'prouser', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Use: user, prouser, admin' }, { status: 400 });
    }

    const [user] = await sql`
      UPDATE users SET role = ${role} WHERE id = ${params.id}
      RETURNING id, username, role
    `;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[PATCH /api/admin/users/[id]/role]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
