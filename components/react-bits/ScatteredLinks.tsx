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
  const [likeOverrides, setLikeOverrides] = useState<Record<string, { liked: boolean; count: number }>>({});

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

  const isLiked = (link: any) => likeOverrides[link.id]?.liked ?? !!link.liked_by_user;

  const handleLike = async (link: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(link.id);
      return;
    }
    const prev = { liked: isLiked(link), count: likeOverrides[link.id]?.count ?? (link.like_count ?? 0) };
    setLikeOverrides(p => ({ ...p, [link.id]: { liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) } }));
    try {
      const res = await fetch(`/api/links/${link.id}/like`, { method: 'POST' });
      if (res.status === 401) {
        setLikeOverrides(p => ({ ...p, [link.id]: prev }));
        router.push(`/login?from=${window.location.pathname}`);
        return;
      }
      if (!res.ok) {
        setLikeOverrides(p => ({ ...p, [link.id]: prev }));
        return;
      }
      const data = await res.json();
      setLikeOverrides(p => ({ ...p, [link.id]: { liked: data.liked, count: data.like_count } }));
    } catch {
      setLikeOverrides(p => ({ ...p, [link.id]: prev }));
    }
  };

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
              role="link"
              tabIndex={0}
              onClick={() => {
                setNavigatingId(link.id);
                if (apiEndpoint) storeListNavigation(apiEndpoint, displayLinks.map((l: any) => String(l.id)), safePage + 1, itemsPerPage, totalItems);
                router.push(`/link/${link.id}`);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setNavigatingId(link.id);
                  if (apiEndpoint) storeListNavigation(apiEndpoint, displayLinks.map((l: any) => String(l.id)), safePage + 1, itemsPerPage, totalItems);
                  router.push(`/link/${link.id}`);
                }
              }}
            >
              {navigatingId === link.id && (
                <div className="card-loading-overlay" aria-hidden="true">
                  <div className="card-spinner" />
                </div>
              )}
              <div className="card-body">
                <div className="card-title">{link.title || 'Untitled'}</div>
                {link.description && <div className="card-desc">{link.description}</div>}
              </div>
              <div className="card-actions">
                <button
                  className={`card-stat${isLiked(link) ? ' active' : ''}`}
                  onClick={(e) => handleLike(link, e)}
                  type="button"
                  title={isLiked(link) ? 'Unlike' : 'Like'}
                  aria-label={isLiked(link) ? 'Unlike' : 'Like'}
                  aria-pressed={isLiked(link)}
                >
                  <svg width="16" height="16" fill={isLiked(link) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.35-1.92-4.25-4.29-4.25-1.69 0-3.15.97-3.85 2.38A4.32 4.32 0 008.86 4C6.48 4 4.5 5.9 4.5 8.25c0 6.03 7.5 10.75 7.5 10.75s9-4.72 9-10.75z" />
                  </svg>
                </button>
                <button
                  className={`card-stat${isBookmarked(link) ? ' active' : ''}`}
                  onClick={(e) => handleBookmark(link, e)}
                  type="button"
                  title={isBookmarked(link) ? 'Remove bookmark' : 'Bookmark'}
                  aria-label={isBookmarked(link) ? 'Remove bookmark' : 'Bookmark'}
                  aria-pressed={isBookmarked(link)}
                >
                  <svg width="16" height="16" fill={isBookmarked(link) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </button>
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