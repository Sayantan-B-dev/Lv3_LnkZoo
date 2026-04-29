'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

const DURATION = 10;

export default function RandomPage() {
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(DURATION);
  const [isPaused, setIsPaused] = useState(false);

  const fetchRandom = useCallback(async (excludeId?: string) => {
    setLoading(true);
    try {
      const excludeParam = excludeId ? `&exclude=${excludeId}` : '';
      const res = await fetch(`/api/links/random?t=${Date.now()}${excludeParam}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLink(data.link);
        setCountdown(DURATION);
      }
    } catch (err) {
      console.error('Failed to fetch random link', err);
      setLink(null);
      setIsPaused(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) await fetchRandom();
    };
    load();
    return () => { isMounted = false; };
  }, [fetchRandom]);

  useEffect(() => {
    if (loading || isPaused) return;

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(c => Math.max(0, c - 0.1));
      }, 100);
      return () => clearInterval(timer);
    } else {
      fetchRandom(link?.id);
    }
  }, [countdown, loading, isPaused, fetchRandom, link?.id]);

  return (
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
        <Topbar title="Random Discovery" />
        <NotificationPanel />
        
        <div id="content" className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="random-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>Internet Roulette</h1>
            <p style={{ color: 'var(--text-4)', fontSize: '14px', marginTop: '8px' }}>Auto-discovering something new every {DURATION} seconds.</p>
          </div>

          <div style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            {loading && !link ? (
              <div className="link-card" style={{ height: '240px' }}>
                <div className="skel" style={{ width: '100%', height: '100%' }}></div>
              </div>
            ) : link ? (
              <div className="link-card detail fade-in" style={{ padding: '32px', border: '2px solid var(--border)', background: 'var(--bg-1)' }}>
                <div className="card-body">
                  <div className="card-meta" style={{ marginBottom: '16px' }}>
                    <span className="card-domain" style={{ background: 'var(--bg-2)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                      {new URL(link.original_url).hostname}
                    </span>
                    <span className="card-poster">@{link.username}</span>
                  </div>
                  <div className="card-title" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.3' }}>{link.title}</div>
                  <div className="card-desc" style={{ fontSize: '15px', color: 'var(--text-3)', marginBottom: '24px', lineHeight: '1.6' }}>{link.description}</div>
                  <div className="card-tags" style={{ marginBottom: '24px' }}>
                    {link.tags?.map((t: string) => <span key={t} className="tag">#{t}</span>)}
                  </div>
                  <div className="card-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a href={link.original_url} target="_blank" rel="noopener" className="visit-btn" onClick={() => setIsPaused(true)}>Visit Discovery ↗</a>
                    <div className="card-stats" style={{ display: 'flex', gap: '16px' }}>
                      <span className="card-stat" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                        {link.upvote_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty">No links available to discover.</div>
            )}

            {!loading && link && (
              <div className="auto-progress">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${(countdown / DURATION) * 100}%` }}></div>
                </div>
                <div className="progress-text">{isPaused ? 'Paused' : `Next discovery in ${Math.ceil(countdown)}s`}</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className="action-btn"
            >
              {isPaused ? 'Resume Auto-play' : 'Pause'}
            </button>
            <button 
              onClick={() => { setCountdown(DURATION); fetchRandom(link?.id); }} 
              className="action-btn primary"
              disabled={loading}
            >
              Skip
            </button>
          </div>
        </div>

        <style jsx>{`
          .visit-btn { 
            padding: 10px 24px; background: var(--text); color: var(--bg); 
            border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.2s;
          }
          .visit-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(255,255,255,0.1); }
          
          .auto-progress { margin-top: 24px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }
          .progress-bar-bg { width: 100%; height: 6px; background: var(--bg-3); border-radius: 3px; overflow: hidden; border: 1px solid var(--border); }
          .progress-bar-fill { height: 100%; background: var(--text); transition: width 0.1s linear; }
          .progress-text { font-size: 11px; color: var(--text-4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; }
          
          .action-btn {
            padding: 12px 32px; background: var(--bg-1); border: 1px solid var(--border); 
            border-radius: 30px; font-size: 14px; font-weight: 600; color: var(--text-2);
            transition: all 0.2s; cursor: pointer; min-width: 160px;
          }
          .action-btn:hover { border-color: var(--text-4); background: var(--bg-2); color: var(--text); }
          .action-btn.primary { background: var(--bg-2); border-color: var(--text-4); color: var(--text); }
        `}</style>
      </main>
    </div>
  );
}
