import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async (req: NextRequest) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const state = crypto.randomBytes(16).toString('hex');

  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    state,
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const res = NextResponse.redirect(`${rootUrl}?${new URLSearchParams(options).toString()}`);
  res.cookies.set('oauth_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
  return res;
});