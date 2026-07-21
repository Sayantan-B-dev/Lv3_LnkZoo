'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface TopicSelectOption {
  id: number;
  slug: string;
  name: string;
  color?: string | null;
}

export interface TopicSelectGroup {
  id: number;
  name: string;
  color?: string | null;
  topics: TopicSelectOption[];
}

interface TopicSelectProps {
  value: string;
  onChange: (value: string) => void;
  groups: TopicSelectGroup[];
  placeholder?: string;
  required?: boolean;
}

export default function TopicSelect({
  value,
  onChange,
  groups,
  placeholder = 'Select a topic',
  required,
}: TopicSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const selected = useMemo(() => {
    for (const g of groups) {
      const found = g.topics.find((t) => String(t.id) === value);
      if (found) return { ...found, group: g.name };
    }
    return null;
  }, [groups, value]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        topics: g.topics.filter(
          (t) => t.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.topics.length > 0);
  }, [groups, search]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="topic-select" ref={ref}>
      <button
        type="button"
        className={`topic-select-trigger ${open ? 'open' : ''}${required && !value ? ' required' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="topic-select-value">
          {selected ? (
            <>
              <span
                className="topic-select-dot"
                style={{ background: selected.color || 'var(--accent)' }}
              />
              <span className="topic-select-name">{selected.name}</span>
              <span className="topic-select-group">{selected.group}</span>
            </>
          ) : (
            <span className="topic-select-placeholder">{placeholder}</span>
          )}
        </span>
        <svg
          className="topic-select-chevron"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.18s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="topic-select-panel" role="listbox">
          <div className="topic-select-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="topic-select-list">
            {!required && (
              <button
                type="button"
                className={`topic-select-item none ${value === '' ? 'active' : ''}`}
                onClick={() => choose('')}
              >
                <span className="topic-select-dot muted" />
                No topic
              </button>
            )}

            {filteredGroups.length === 0 ? (
              <div className="topic-select-empty">No topics found</div>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.id} className="topic-select-group-block">
                  <div className="topic-select-group-label">
                    <span
                      className="topic-select-group-dot"
                      style={{ background: g.color || 'var(--accent)' }}
                    />
                    {g.name}
                  </div>
                  {g.topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`topic-select-item ${String(t.id) === value ? 'active' : ''}`}
                      onClick={() => choose(String(t.id))}
                      role="option"
                      aria-selected={String(t.id) === value}
                    >
                      <span
                        className="topic-select-dot"
                        style={{ background: t.color || 'var(--accent)' }}
                      />
                      {t.name}
                      {String(t.id) === value && (
                        <svg className="topic-select-check" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
