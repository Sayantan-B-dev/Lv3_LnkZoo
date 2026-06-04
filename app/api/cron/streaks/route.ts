import { NextResponse } from 'next/server';
import { gamificationService } from '@/services/gamification.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await gamificationService.recalculateStreaks();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[CRON streaks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
