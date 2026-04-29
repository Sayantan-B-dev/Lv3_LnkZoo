'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

export default function DailyDose() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDose = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/links/daily-dose');
        if (res.ok) {
          const data = await res.json();
          setLinks(data.links);
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
    <div id="app">
      <CustomCursor />
      
      <Sidebar />
      <main id="main">
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
                <div key={i} className="link-card" style={{ height: '140px' }}><div className="skel" style={{ width: '100%', height: '100%' }}></div></div>
              ))
            ) : links.length === 0 ? (
              <div className="empty">The community was quiet today. check back soon!</div>
            ) : (
              links.map((link: any, index: number) => (
                <div key={link.id} className="dose-card">
                  <div className="dose-number">0{index + 1}</div>
                  <div className="link-card" style={{ flex: 1, marginBottom: 0 }}>
                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-domain">{new URL(link.original_url).hostname}</span>
                        <span className="card-poster">@{link.username}</span>
                      </div>
                      <Link href={`/link/${link.id}`} className="card-title" style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px', display: 'block' }}>
                        {link.title}
                      </Link>
                      <div className="card-desc">{link.description}</div>
                      <div className="card-footer">
                        <span className="card-stat">▲ {link.upvote_count}</span>
                        <span className="card-stat">💬 {link.comment_count}</span>
                      </div>
                    </div>
                    {link.preview_image && (
                      <div className="card-preview" style={{ width: '100px', height: '70px' }}>
                        <img src={link.preview_image} alt={link.title} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <style jsx>{`
          .dose-header { margin-bottom: 40px; border-bottom: 1px solid var(--border); padding-bottom: 24px; }
          .dose-title { font-size: 28px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -0.5px; }
          .dose-sub { font-size: 14px; color: var(--text-4); }
          .dose-list { display: flex; flex-direction: column; gap: 24px; }
          .dose-card { display: flex; gap: 20px; align-items: flex-start; }
          .dose-number { font-size: 32px; font-weight: 700; color: var(--text-4); font-family: 'Geist Mono'; opacity: 0.3; padding-top: 10px; }
        `}</style>
      </main>
    </div>
  );
}
