import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async (req: NextRequest) => {
  const res = NextResponse.json({ ok: true });
  const opts = cookieOptions(req);
  res.cookies.set(opts.name, '', { ...opts, maxAge: 0, expires: new Date(0) });
  return res;
});