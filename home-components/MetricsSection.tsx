'use client';

import { Reveal } from './Reveal';
import { CounterStat } from './CounterStat';

export function MetricsSection({ stats }: { stats: any }) {
  return (
    <Reveal>
      <section className="metrics-section">
        <CounterStat target={stats ? stats.totalLinks : 0} label="Links Shared" />
        <CounterStat target={stats ? stats.totalUsers : 0} label="Active Users" />
        <CounterStat target={stats ? stats.totalLikes : 0} label="Likes Given" />
        <CounterStat target={stats ? stats.dailyActiveUsers : 0} label="Daily Active" />
      </section>
    </Reveal>
  );
}
