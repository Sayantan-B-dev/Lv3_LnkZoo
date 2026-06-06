'use client';

import { useId } from 'react';
import { useScrollReveal, useCountUp } from './hooks';

export function CounterStat({ target, label }: { target: number; label: string }) {
  const id = useId();
  const idx = id.split(':').reduce((acc, s) => acc + [...s].reduce((a, c) => a + c.charCodeAt(0), 0), 0);
  const { ref, revealed } = useScrollReveal(idx);
  const count = useCountUp(target, revealed);
  return (
    <div ref={ref} className={'metric-item reveal ' + (revealed ? 'revealed' : '')}>
      <span className="metric-number">{count.toLocaleString()}+</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}
