'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storeListNavigation } from '@/lib/linknav';

interface ScatteredLinksProps {
  links?: any[];
  itemsPerPage?: number;
  apiEndpoint?: string;
  onLike?: (linkId: string) => void;
}

export default function ScatteredLinks({ links: initialLinks, itemsPerPage = 30, apiEndpoint, onLike }: ScatteredLinksProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const [serverLinks, setServerLinks] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [bmOverrides, setBmOverrides] = useState<Record<string, boolean>>({});

  const isServerSide = !!apiEndpoint;

  const totalPages = isServerSide
    ? Math.max(1, Math.ceil(totalItems / itemsPerPage))
    : Math.max(1, Math.ceil((initialLinks?.length || 0) / itemsPerPage));

  const safePage = Math.min(page, totalPages - 1);

  useEffect(() => {
    if (!apiEndpoint) return;
    let cancelled = false;
    const fetchPage = async () => {
      setLoading(true);
      try {
        const sep = apiEndpoint.includes('?') ? '&' : '?';
        const res = await fetch(`${apiEndpoint}${sep}limit=${itemsPerPage}&page=${safePage + 1}`);
        if (!res.ok) {
          console.error('[ScatteredLinks] API error', res.status, await res.text().catch(() => ''));
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setServerLinks(data.links || []);
        setTotalItems(data.total || 0);
        setBmOverrides({});
      } catch (e) {
        console.error('[ScatteredLinks] fetch catch', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPage();
    return () => { cancelled = true; };
  }, [apiEndpoint, safePage, itemsPerPage]);

  const displayLinks = isServerSide
    ? serverLinks
    : (initialLinks || []).slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

  if (isServerSide && loading && serverLinks.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>Loading...</div>;
  }
  if (displayLinks.length === 0) return null;

  const isBookmarked = (link: any) => bmOverrides[link.id] ?? !!link.bookmarked_by_user;

  const handleBookmark = async (link: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const prevState = isBookmarked(link);
    setBmOverrides(p => ({ ...p, [link.id]: !prevState }));
    try {
      const res = await fetch(`/api/links/${link.id}/bookmark`, { method: prevState ? 'DELETE' : 'POST' });
      if (res.status === 401) {
        setBmOverrides(p => ({ ...p, [link.id]: prevState }));
        router.push(`/login?from=${window.location.pathname}`);
        return;
      }
      if (!res.ok) setBmOverrides(p => ({ ...p, [link.id]: prevState }));
    } catch {
      setBmOverrides(p => ({ ...p, [link.id]: prevState }));
    }
  };

  return (
    <div className="scattered-root">
      <div className="scattered-stage">
        {displayLinks.map((link: any) => (
          <div
            key={link.id}
            className="scattered-card-wrap"
          >
            <div
              className={`link-card${navigatingId === link.id ? ' navigating' : ''}`}
              style={link.topic_color ? ({ '--topic-color': link.topic_color } as React.CSSProperties) : undefined}
              onClick={() => {
                setNavigatingId(link.id);
                if (apiEndpoint) storeListNavigation(apiEndpoint, displayLinks.map((l: any) => String(l.id)), safePage + 1, itemsPerPage, totalItems);
                router.push(`/link/${link.id}`);
              }}
            >
              {navigatingId === link.id && (
                <div className="card-loading-overlay" aria-hidden="true">
                  <div className="card-spinner" />
                </div>
              )}
              <div className="card-body">
                <div className="card-meta">
                  <span className="card-domain">{link.original_url ? new URL(link.original_url).hostname : ''}</span>
                  {link.username && <span className="card-poster">@{link.username}</span>}
                  <span className="card-time">{link.created_at ? new Date(link.created_at).toLocaleDateString() : ''}</span>
                </div>
                <div className="card-title">{link.title || 'Untitled'}</div>
                {link.description && <div className="card-desc">{link.description}</div>}
                {link.tags && link.tags.length > 0 && (
                  <div className="card-tags">
                    {link.tags.map((tag: string) => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
                <div className="card-footer">
                  <button className={`card-stat${link.liked_by_user ? ' active' : ''}`} onClick={(e) => { e.stopPropagation(); onLike?.(link.id); }}>
                    <svg width="12" height="12" fill={link.liked_by_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.35-1.92-4.25-4.29-4.25-1.69 0-3.15.97-3.85 2.38A4.32 4.32 0 008.86 4C6.48 4 4.5 5.9 4.5 8.25c0 6.03 7.5 10.75 7.5 10.75s9-4.72 9-10.75z" />
                    </svg>
                    {link.like_count ?? 0}
                  </button>
                  <button
                    className={`card-stat${isBookmarked(link) ? ' active' : ''}`}
                    onClick={(e) => handleBookmark(link, e)}
                    title={isBookmarked(link) ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <svg width="12" height="12" fill={isBookmarked(link) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>
                  <span className="card-stat">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    {link.comment_count ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="scattered-pagination">
          <button className="scattered-page-btn" disabled={safePage === 0} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          {(() => {
            const cur = safePage + 1;
            const total = totalPages;
            const pages: (number | 'ellipsis')[] = [];
            for (let i = 1; i <= total; i++) {
              if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) {
                pages.push(i);
              } else if (pages[pages.length - 1] !== 'ellipsis') {
                pages.push('ellipsis');
              }
            }
            return pages.map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`e-${idx}`} className="scattered-page-ellipsis">...</span>
              ) : (
                <button key={p} className={`scattered-page-num${p === cur ? ' active' : ''}`} onClick={() => setPage(p - 1)}>{p}</button>
              )
            );
          })()}
          <button className="scattered-page-btn" disabled={safePage === totalPages - 1} onClick={() => setPage(p => p + 1)} aria-label="Next page">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}