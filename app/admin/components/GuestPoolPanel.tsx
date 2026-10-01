'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { formatCountdown } from '@/lib/textShareRules';
import { formatBytes } from '@/lib/tempFileRules';
import { stripOrigin, toolItemKey, type ToolItem } from '@/components/tools/ToolItemRow';

const PANEL_LIMIT = 30;

const TYPE_LABEL: Record<ToolItem['type'], string> = {
  short: 'Short link',
  file: 'File',
  text: 'Text',
};

async function loadPool(page: number) {
  const res = await fetch(
    `/api/admin/guest-pool?page=${page}&limit=${PANEL_LIMIT}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function GuestPoolPanel() {
  const { addToast } = useToast();

  const [items, setItems] = useState<ToolItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await loadPool(1);
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setHasMore(!!data.hasMore);
        setError(null);
      } catch {
        if (!cancelled) setError('Could not load the guest pool.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await loadPool(nextPage);
      const next: ToolItem[] = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => {
        const seen = new Set(prev.map(toolItemKey));
        return [...prev, ...next.filter((i) => !seen.has(toolItemKey(i)))];
      });
      setHasMore(!!data.hasMore);
      setPage(nextPage);
    } catch {
      addToast('Failed to load more', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRemove = async (item: ToolItem) => {
    const key = toolItemKey(item);
    setBusyKey(key);
    try {
      const res = await fetch(`/api/admin/guest-pool/${item.type}/${item.code}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => toolItemKey(i) !== key));
      addToast('Removed from the pool', 'success');
    } catch {
      addToast('Failed to remove', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const active = items.filter((i) => new Date(i.expiresAt).getTime() > now);

  return (
    <div className="adm-chart-card adm-chart-full">
      <div className="adm-chart-header">
        <span className="adm-chart-title">Guest Pool</span>
        <span className="adm-chart-total">{active.length} shown</span>
      </div>

      <p className="gp-note">
        Owner-less tool output created without an account. It is public at{' '}
        <Link href="/guest-pool">/guest-pool</Link> until each row expires —
        removing one is permanent (a file also loses its stored asset). Rows made
        by signed-in users never appear here.
      </p>

      {loading ? (
        <div className="fb-admin-skeleton">
          <div className="skel" style={{ height: '38px' }} />
          <div className="skel" style={{ height: '38px' }} />
          <div className="skel" style={{ height: '38px' }} />
        </div>
      ) : error ? (
        <div className="adm-empty">{error}</div>
      ) : (
        <>
          <div className="gp-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Link</th>
                  <th>Details</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {active.map((item) => {
                  const key = toolItemKey(item);
                  const remaining = Math.max(
                    0,
                    Math.ceil((new Date(item.expiresAt).getTime() - now) / 1000)
                  );
                  return (
                    <tr key={key}>
                      <td>
                        <span className="gp-type">{TYPE_LABEL[item.type]}</span>
                      </td>
                      <td>
                        <a
                          className="gp-link"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {stripOrigin(item.url)}
                        </a>
                        {item.originalUrl && (
                          <span className="gp-target">{item.originalUrl}</span>
                        )}
                      </td>
                      <td className="gp-details">
                        {item.type === 'short' && `${item.clickCount ?? 0} clicks`}
                        {item.type === 'file' && formatBytes(item.sizeBytes ?? 0)}
                        {item.type === 'text' && 'content withheld'}
                      </td>
                      <td className="gp-when">{formatWhen(item.createdAt)}</td>
                      <td
                        className="gp-when"
                        title={new Date(item.expiresAt).toLocaleString()}
                      >
                        {formatCountdown(remaining)} left
                      </td>
                      <td className="gp-actions">
                        <button
                          className="gp-remove"
                          onClick={() => handleRemove(item)}
                          disabled={busyKey === key}
                        >
                          {busyKey === key ? '...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {active.length === 0 && (
                  <tr>
                    <td colSpan={6} className="adm-empty">
                      The guest pool is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="gp-more">
              <button
                className="gp-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
