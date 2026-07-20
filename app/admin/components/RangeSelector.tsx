'use client';
import React from 'react';

export type Range = '7' | '30' | '90' | 'all';

const OPTIONS: { value: Range; label: string }[] = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: 'all', label: 'All' },
];

export default function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="adm-range">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          className={`adm-range-btn${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
