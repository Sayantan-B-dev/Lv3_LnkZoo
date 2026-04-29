'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import Link from 'next/link';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const data = await res.json();
          setTags(data.tags);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  return (
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
        <Topbar title="Explore Tags" />
        <NotificationPanel />
        <div id="content" className="fade-in">
          <div className="section-title">Trending Tags</div>
          <div className="tag-grid">
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <div key={i} className="tag-skeleton" />)
            ) : tags.length === 0 ? (
              <div className="empty">No tags found.</div>
            ) : (
              tags.map((tag: any) => (
                <Link href={`/tags/${tag.name}`} key={tag.id} className="tag-large">
                  <span className="tag-name">#{tag.name}</span>
                  <span className="tag-count">{tag.usage_count} posts</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .tag-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-top: 24px; }
        .tag-large { 
          display: flex; flex-direction: column; gap: 4px; padding: 20px; background: var(--bg-1); border: 1px solid var(--border); 
          border-radius: 12px; transition: all 0.2s; text-decoration: none;
        }
        .tag-large:hover { border-color: var(--text-4); transform: translateY(-2px); background: var(--bg-2); }
        .tag-name { font-size: 16px; font-weight: 600; color: var(--text-2); }
        .tag-count { font-size: 12px; color: var(--text-4); }
        .tag-skeleton { height: 80px; background: var(--bg-2); border-radius: 12px; border: 1px solid var(--border); opacity: 0.5; }
        .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); }
      `}</style>
    </div>
  );
}
