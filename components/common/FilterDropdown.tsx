'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  allLabel?: string;
}

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  allLabel = 'All',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const selected = value ? options.find((o) => o.value === value) : null;

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`filter-dropdown-trigger${value ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="filter-dropdown-label">{label}</span>
        <span className="filter-dropdown-value">{selected ? selected.label : allLabel}</span>
        {selected?.count != null && <span className="filter-dropdown-count">{selected.count}</span>}
        <svg
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="filter-dropdown-menu" role="listbox" aria-label={label}>
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={`filter-dropdown-item${!value ? ' active' : ''}`}
            onClick={() => { onChange(null); setOpen(false); }}
          >
            <span>{allLabel}</span>
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              className={`filter-dropdown-item${value === opt.value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              {opt.count != null && <span className="filter-dropdown-count">{opt.count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
