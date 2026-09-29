'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { formatCountdown } from '@/lib/textShareRules';
import { formatBytes } from '@/lib/tempFileRules';

type ToolItemType = 'short' | 'file' | 'text';

interface ToolItem {
  type: ToolItemType;
  code: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  originalUrl?: string;
  clickCount?: number;
  fileName?: string;
  sizeBytes?: number;
  preview?: string;
}

const TYPE_META: Record<ToolItemType, { label: string; icon: React.ReactNode }> = {
  short: {
    label: 'URL Shortener',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 7H7a5 5 0 000 10h2" />
        <path d="M15 7h2a5 5 0 010 10h-2" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  file: {
    label: 'File Transfer',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
  text: {
    label: 'Text Share',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h9" />
      </svg>
    ),
  },
};

const itemKey = (item: ToolItem) => `${item.type}:${item.code}`;

const itemLabel = (item: ToolItem): string | undefined => {
  if (item.type === 'short') return item.originalUrl;
  if (item.type === 'file') return item.fileName;
  return item.preview;
};

const stripOrigin = (url: string) => url.replace(/^https?:\/\/[^/]+/, '');

async function fetchToolItems(): Promise<ToolItem[]> {
  const res = await fetch('/api/tools/items', { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export default function ToolItems() {
  const { addToast } = useToast();
  const [items, setItems] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destroying, setDestroying] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const next = await fetchToolItems();
        if (cancelled) return;
        setItems(next);
        setError(null);
      } catch {
        if (!cancelled) setError('Could not load your tool links.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const next = await fetchToolItems();
      setItems(next);
      setError(null);
    } catch {
      setError('Could not load your tool links.');
    } finally {
      setLoading(false);
    }
  };

  // One shared ticker keeps every countdown honest without per-row timers.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDestroy = async (item: ToolItem) => {
    const key = itemKey(item);
    setDestroying(key);
    try {
      const res = await fetch(`/api/tools/items/${item.type}/${item.code}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.filter((i) => itemKey(i) !== key));
      addToast('Destroyed', 'success');
    } catch {
      addToast('Failed to destroy', 'error');
    } finally {
      setDestroying(null);
    }
  };

  // Expired rows are gone server-side; they only drop off the list here.
  const active = items.filter((i) => new Date(i.expiresAt).getTime() > now);

  return (
    <section className="profile-tools">
      <div className="section-header-row">
        <h2 className="section-title">Tool Links</h2>
        <button
          type="button"
          className="tool-items-refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="tool-items-skeleton">
          <div className="skel" style={{ height: '58px' }} />
          <div className="skel" style={{ height: '58px' }} />
        </div>
      ) : error ? (
        <div className="tool-items-empty">
          {error}{' '}
          <button type="button" className="tool-items-retry" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      ) : active.length === 0 ? (
        <div className="tool-items-empty">
          Nothing here yet. Short links, files and texts you create while signed
          in show up here until they expire.
        </div>
      ) : (
        <div className="tool-items-list">
          {active.map((item) => {
            const key = itemKey(item);
            const remaining = Math.max(
              0,
              Math.ceil((new Date(item.expiresAt).getTime() - now) / 1000)
            );
            const label = itemLabel(item);
            return (
              <div className="tool-item" key={key}>
                <span className="tool-item-icon">{TYPE_META[item.type].icon}</span>
                <div className="tool-item-body">
                  <div className="tool-item-head">
                    <span className="tool-item-type">{TYPE_META[item.type].label}</span>
                    {item.type === 'short' && (
                      <span className="tool-item-extra">{item.clickCount ?? 0} clicks</span>
                    )}
                    {item.type === 'file' && (
                      <span className="tool-item-extra">
                        {formatBytes(item.sizeBytes ?? 0)}
                      </span>
                    )}
                    <span
                      className="tool-item-expiry"
                      title={`Destroyed at ${new Date(item.expiresAt).toLocaleString()}`}
                    >
                      {formatCountdown(remaining)} left
                    </span>
                  </div>
                  <div className="tool-item-sub">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="tool-item-url"
                    >
                      {stripOrigin(item.url)}
                    </a>
                    {label && <span className="tool-item-name">{label}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="tool-item-destroy"
                  onClick={() => handleDestroy(item)}
                  disabled={destroying === key}
                >
                  {destroying === key ? '...' : 'Destroy'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
