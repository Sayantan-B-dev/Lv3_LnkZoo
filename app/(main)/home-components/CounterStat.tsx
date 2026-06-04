'use client';

import { useScrollReveal, useCountUp, getNextRevealIndex } from './hooks';

export function CounterStat({ target, label }: { target: number; label: string }) {
  const idx = getNextRevealIndex();
  const { ref, revealed } = useScrollReveal(idx);
  const count = useCountUp(target, revealed);
  return (
    <div ref={ref} className={'metric-item reveal ' + (revealed ? 'revealed' : '')}>
      <span className="metric-number">{count.toLocaleString()}+</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}
