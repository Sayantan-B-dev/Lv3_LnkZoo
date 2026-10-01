'use client';

import React, { useEffect, useState } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ToolItemRow, {
  toolItemKey,
  type ToolItem,
} from '@/components/tools/ToolItemRow';

interface PoolPage {
  items: ToolItem[];
  hasMore: boolean;
}

async function fetchGuestPool(page: number): Promise<PoolPage> {
  const res = await fetch(`/api/tools/guest-pool?page=${page}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    items: Array.isArray(data.items) ? data.items : [],
    hasMore: !!data.hasMore,
  };
}

/** Rows created between two page requests would otherwise repeat by offset. */
function appendUnique(prev: ToolItem[], next: ToolItem[]): ToolItem[] {
  const seen = new Set(prev.map(toolItemKey));
  return [...prev, ...next.filter((item) => !seen.has(toolItemKey(item)))];
}

export default function GuestPool() {
  const [items, setItems] = useState<ToolItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const next = await fetchGuestPool(1);
        if (cancelled) return;
        setItems(next.items);
        setHasMore(next.hasMore);
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

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const next = await fetchGuestPool(1);
      setItems(next.items);
      setHasMore(next.hasMore);
      setPage(1);
      setError(null);
    } catch {
      setError('Could not load the guest pool.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const next = await fetchGuestPool(nextPage);
      setItems((prev) => appendUnique(prev, next.items));
      setHasMore(next.hasMore);
      setPage(nextPage);
      setError(null);
    } catch {
      setError('Could not load more of the pool.');
    } finally {
      setLoadingMore(false);
    }
  };

  // One shared ticker drives every countdown on the page.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Expired rows are gone server-side; they only drop off the list here.
  const active = items.filter((i) => new Date(i.expiresAt).getTime() > now);

  return (
    <>
      <Topbar title="Guest Pool" />
      <NotificationPanel />

      <div id="content">
        <div className="guest-pool">
          <div className="section-header-row">
            <h2 className="section-title">Guest Pool</h2>
            <div className="guest-pool-actions">
              {!loading && !error && (
                <span className="guest-pool-count">
                  {active.length} live
                </span>
              )}
              <button
                type="button"
                className="tool-items-refresh"
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>

          <p className="guest-pool-sub">
            The pool is built for guests but open to everyone — logged out or
            signed in, you see exactly the same list, and every link in it is
            public. It holds what guests have created with the tools (short
            links, files and shared texts) while it is still alive: nothing
            belongs to an account, each item self-destructs at its own original
            expiry, and signed-in output never lands here. Filenames and text
            contents are never shown, only the link and its countdown.
          </p>

          {loading ? (
            <div className="tool-items-skeleton">
              <div className="skel" style={{ height: '58px' }} />
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
              The pool is empty. Anything a guest creates on the tools page shows
              up here until it expires.
            </div>
          ) : (
            <>
              <div className="tool-items-list">
                {active.map((item) => (
                  <ToolItemRow key={toolItemKey(item)} item={item} now={now} />
                ))}
              </div>

              <div className="guest-pool-more">
                {hasMore ? (
                  <button
                    type="button"
                    className="guest-pool-load"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                ) : (
                  <span className="guest-pool-end">
                    That&apos;s the whole pool right now.
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
