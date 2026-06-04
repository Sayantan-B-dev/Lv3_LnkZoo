import { NextResponse } from 'next/server';
import { cookieOptions } from '@/lib/auth';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(async () => {
  const res = NextResponse.json({ ok: true });
  const opts = cookieOptions();
  res.cookies.set(opts.name, '', { ...opts, maxAge: 0 });
  return res;
});