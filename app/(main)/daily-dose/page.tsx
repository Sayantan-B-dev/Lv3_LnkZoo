'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useRouter } from 'next/navigation';

export default function DailyDose() {
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeOverrides, setLikeOverrides] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [bmOverrides, setBmOverrides] = useState<Record<string, boolean>>({});

  const isLiked = (link: any) => likeOverrides[link.id]?.liked ?? !!link.liked_by_user;
  const isBookmarked = (link: any) => bmOverrides[link.id] ?? !!link.bookmarked_by_user;

  const handleLike = async (link: any, e: React.MouseEvent) => {
    e.stopPropagation();
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
    const prev = isBookmarked(link);
    setBmOverrides(p => ({ ...p, [link.id]: !prev }));
    try {
      const res = await fetch(`/api/links/${link.id}/bookmark`, { method: prev ? 'DELETE' : 'POST' });
      if (res.status === 401) {
        setBmOverrides(p => ({ ...p, [link.id]: prev }));
        router.push(`/login?from=${window.location.pathname}`);
        return;
      }
      if (!res.ok) setBmOverrides(p => ({ ...p, [link.id]: prev }));
    } catch {
      setBmOverrides(p => ({ ...p, [link.id]: prev }));
    }
  };

  useEffect(() => {
    const fetchDose = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/links/daily-dose');
        if (res.ok) {
          const data = await res.json();
          if (data.links && data.links.length > 0) {
            setLinks(data.links);
            setLoading(false);
            return;
          }
        }
        // fallback: fetch 5 random links
        const randRes = await fetch('/api/links/random?limit=5');
        if (randRes.ok) {
          const randData = await randRes.json();
          setLinks(randData.links || []);
        }
      } catch (err) {
        console.error('Failed to fetch daily dose', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDose();
  }, []);

  return (
    <>
      <Topbar title="Daily Dose" />
      <NotificationPanel />
      
      <div id="content">
        <div className="dose-header">
          <h1 className="dose-title">The Daily Dose</h1>
          <p className="dose-sub">Top 5 links from the last 24 hours, hand-picked by the community.</p>
        </div>

        <div className="dose-list">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="dose-link-card" style={{ height: '52px' }}><div className="skel" style={{ width: '100%', height: '100%' }}></div></div>
            ))
          ) : links.length === 0 ? (
            <div className="empty">No links available right now.</div>
          ) : (
            links.map((link: any, index: number) => (
              <div key={link.id} className="dose-link-card" onClick={() => router.push(`/link/${link.id}`)}>
                <div className="dose-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="dose-link-body">
                  <div className="dose-link-title">{link.title || 'Untitled'}</div>
                  {link.description && <div className="dose-link-desc">{link.description}</div>}
                </div>
                <div className="dose-link-actions">
                  <button
                    className={`dose-link-stat${isLiked(link) ? ' active' : ''}`}
                    onClick={(e) => handleLike(link, e)}
                    type="button"
                    title={isLiked(link) ? 'Unlike' : 'Like'}
                    aria-label={isLiked(link) ? 'Unlike' : 'Like'}
                    aria-pressed={isLiked(link)}
                  >
                    <svg width="15" height="15" fill={isLiked(link) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.35-1.92-4.25-4.29-4.25-1.69 0-3.15.97-3.85 2.38A4.32 4.32 0 008.86 4C6.48 4 4.5 5.9 4.5 8.25c0 6.03 7.5 10.75 7.5 10.75s9-4.72 9-10.75z" />
                    </svg>
                  </button>
                  <button
                    className={`dose-link-stat${isBookmarked(link) ? ' active' : ''}`}
                    onClick={(e) => handleBookmark(link, e)}
                    type="button"
                    title={isBookmarked(link) ? 'Remove bookmark' : 'Bookmark'}
                    aria-label={isBookmarked(link) ? 'Remove bookmark' : 'Bookmark'}
                    aria-pressed={isBookmarked(link)}
                  >
                    <svg width="15" height="15" fill={isBookmarked(link) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
