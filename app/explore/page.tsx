'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

export default function Explore() {
  const [tags, setTags] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tagsRes, linksRes] = await Promise.all([
          fetch('/api/tags'),
          fetch('/api/links?tab=explore&limit=10')
        ]);
        
        if (tagsRes.ok && linksRes.ok) {
          const tagsData = await tagsRes.json();
          const linksData = await linksRes.json();
          setTags(tagsData.tags);
          setTopLinks(linksData.links);
        }
      } catch (err) {
        console.error('Failed to fetch explore data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
        <Topbar title="Explore" />
        <NotificationPanel />
        
        <div id="content">
          <section className="explore-section">
            <h2 className="section-title">Popular Tags</h2>
            <div className="tag-cloud">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skel" style={{ width: '60px', height: '24px', borderRadius: '4px' }}></div>
                ))
              ) : (
                tags.map((tag: any) => (
                  <div key={tag.id} className="tag-item">
                    <span className="tag-name">#{tag.name}</span>
                    <span className="tag-count">{tag.usage_count}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="explore-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Trending Links</h2>
            <div className="trending-list">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="link-card" style={{ height: '80px' }}>
                    <div className="skel" style={{ width: '100%', height: '100%' }}></div>
                  </div>
                ))
              ) : (
                topLinks.map((link: any) => (
                  <div key={link.id} className="link-card mini">
                    <div className="card-body">
                      <div className="card-title" style={{ fontSize: '12px' }}>{link.title}</div>
                      <div className="card-meta">
                        <span className="card-domain">{new URL(link.original_url).hostname}</span>
                        <span className="card-stat">▲ {link.upvote_count}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <style jsx>{`
          .explore-section { margin-bottom: 2rem; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); margin-bottom: 16px; }
          .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
          .tag-item { 
            display: flex; align-items: center; gap: 6px; 
            padding: 6px 12px; background: var(--bg-1); 
            border: 1px solid var(--border); border-radius: 6px;
            transition: all 0.2s; cursor: pointer;
          }
          .tag-item:hover { border-color: var(--text-4); background: var(--bg-2); }
          .tag-name { font-size: 12px; color: var(--text-2); }
          .tag-count { font-size: 10px; color: var(--text-4); }
          .trending-list { display: flex; flex-direction: column; gap: 8px; }
          .link-card.mini { padding: 10px 14px; }
        `}</style>
      </main>
    </div>
  );
}
