'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import ToolItemRow, {
  toolItemKey,
  type ToolItem,
} from '@/components/tools/ToolItemRow';

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
    const key = toolItemKey(item);
    setDestroying(key);
    try {
      const res = await fetch(`/api/tools/items/${item.type}/${item.code}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.filter((i) => toolItemKey(i) !== key));
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
            const key = toolItemKey(item);
            return (
              <ToolItemRow
                key={key}
                item={item}
                now={now}
                onDestroy={handleDestroy}
                destroying={destroying === key}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
