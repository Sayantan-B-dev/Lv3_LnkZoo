import { NextResponse } from 'next/server';
import { gamificationService } from '@/services/gamification.service';
import { apiHandler } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  try {
    await gamificationService.recalculateStreaks();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[CRON streaks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});