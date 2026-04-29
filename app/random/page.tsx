'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

export default function RandomPage() {
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRandom = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/links/random?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLink(data.link);
      }
    } catch (err) {
      console.error('Failed to fetch random link', err);
      setLink(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandom();
  }, []);

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
            <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Internet Roulette</h1>
            <p style={{ color: 'var(--text-4)', fontSize: '13px' }}>Discover something you wouldn't have found otherwise.</p>
          </div>

          <div style={{ width: '100%', maxWidth: '600px' }}>
            {loading ? (
              <div className="link-card" style={{ height: '160px' }}><div className="skel" style={{ width: '100%', height: '100%' }}></div></div>
            ) : link ? (
              <div className="link-card" style={{ padding: '24px' }}>
                <div className="card-body">
                  <div className="card-meta">
                    <span className="card-domain">{new URL(link.original_url).hostname}</span>
                    <span className="card-poster">@{link.username}</span>
                  </div>
                  <div className="card-title" style={{ fontSize: '18px', marginBottom: '12px' }}>{link.title}</div>
                  <div className="card-desc" style={{ fontSize: '13px', marginBottom: '16px' }}>{link.description}</div>
                  <div className="card-tags" style={{ marginBottom: '20px' }}>
                    {link.tags?.map((t: string) => <span key={t} className="tag">#{t}</span>)}
                  </div>
                  <div className="card-footer">
                    <a href={link.original_url} target="_blank" rel="noopener" className="visit-btn">Visit Link ↗</a>
                    <span className="card-stat">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                      {link.upvote_count}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty">No links available.</div>
            )}
          </div>

          <button onClick={fetchRandom} className="roll-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? 'Rolling...' : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.688.06 1.386.09 2.09.09H16.5a4.5 4.5 0 100-9h-.75c-.704 0-1.402.03-2.09.09M10.34 15.84L15.75 21l-1.05-1.05m-4.36-4.11l1.41-1.41M13.66 8.16l-5.41-5.16 1.05 1.05m4.36 4.11l-1.41 1.41"/></svg>
                Roll Again
              </>
            )}
          </button>
        </div>

        <style jsx>{`
          .visit-btn { 
            padding: 8px 16px; background: var(--text); color: var(--bg); 
            border-radius: 6px; font-size: 12px; font-weight: 500;
          }
          .roll-btn { 
            margin-top: 40px; padding: 12px 32px; background: var(--bg-1); 
            border: 1px solid var(--border); border-radius: 30px; 
            font-size: 14px; font-weight: 500; color: var(--text-2);
            transition: all 0.2s; cursor: pointer;
          }
          .roll-btn:hover { border-color: var(--text-4); background: var(--bg-2); color: var(--text); }
        `}</style>
      </main>
    </div>
  );
}
