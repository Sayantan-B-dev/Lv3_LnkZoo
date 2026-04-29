'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TagPage({ params }: { params: { tag: string } }) {
  const { tag } = params;
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/links?tag=${tag}`);
        if (res.ok) {
          const data = await res.json();
          setLinks(data.links);
        }
      } catch (err) {
        console.error('Failed to fetch links', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, [tag]);

  return (
    <div id="app">
      <CustomCursor />
      <Sidebar />
      <main id="main">
        <Topbar title={`#${tag}`} />
        <NotificationPanel />
        
        <div id="content">
          <div className="view active">
            <h2 className="section-title">Posts tagged with #{tag}</h2>
            
            <div id="home-feed">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="link-card" style={{ height: '120px' }}>
                    <div className="skel" style={{ width: '100%', height: '100%' }}></div>
                  </div>
                ))
              ) : links.length === 0 ? (
                <div className="empty">No posts found with this tag.</div>
              ) : (
                links.map((link: any) => (
                  <div 
                    key={link.id} 
                    className="link-card" 
                    onClick={() => router.push(`/link/${link.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="vote-col" onClick={(e) => e.stopPropagation()}>
                      <button className="vote-btn up">▲</button>
                      <span className="vote-count">{link.upvote_count - link.downvote_count}</span>
                      <button className="vote-btn down">▼</button>
                    </div>
                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-domain">{new URL(link.original_url).hostname}</span>
                        <span className="card-poster" onClick={(e) => e.stopPropagation()}>
                          {link.is_anonymous ? <span className="anon-badge">anon</span> : <Link href={`/profile/${link.username}`}>@{link.username}</Link>}
                        </span>
                        <span className="card-time">{new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="card-title" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px' }}>
                        {link.title}
                      </div>
                      <div className="card-desc">{link.description}</div>
                      <div className="card-tags" onClick={(e) => e.stopPropagation()}>
                        {link.tags?.map((t: string) => (
                          <Link key={t} href={`/tags/${t}`} className={`tag ${t === tag ? 'active' : ''}`}>#{t}</Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); margin-bottom: 24px; }
          .tag.active { border-color: var(--text-2); color: var(--text); }
        `}</style>
      </main>
    </div>
  );
}
