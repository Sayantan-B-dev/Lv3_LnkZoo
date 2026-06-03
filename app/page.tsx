'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('explore');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLinks = async (query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/links?q=${encodeURIComponent(query)}`
        : `/api/links?tab=${activeTab}`;
      const res = await fetch(url);
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

  useEffect(() => {
    if (!searchQuery) {
      fetchLinks();
    }
  }, [activeTab, searchQuery]);

  // Live search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchLinks(searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleVote = async (e: React.MouseEvent, id: string, vote: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/links/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      });
      if (res.status === 401) {
        window.location.href = `/login?from=/`;
        return;
      }
      if (res.ok) {
        fetchLinks(searchQuery);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="app">
      <CustomCursor />
      <Sidebar />
      <main id="main">
        <Topbar title="Home" />
        
        <div id="content">
          <div className="view active">
            <div style={{ marginBottom: '24px' }}>
              <div className="search-bar">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input 
                  type="text" 
                  placeholder="Search the web..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            {!searchQuery && (
              <div className="tabs">
                <button className={`tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>following</button>
                <button className={`tab ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>explore</button>
                <button className={`tab ${activeTab === 'recommended' ? 'active' : ''}`} onClick={() => setActiveTab('recommended')}>for you</button>
              </div>
            )}
            
            <div id="home-feed" className="fade-in">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="link-card" style={{ height: '120px' }}>
                    <div className="skel" style={{ width: '100%', height: '100%' }}></div>
                  </div>
                ))
              ) : links.length === 0 ? (
                <div className="empty">No results found.</div>
              ) : (
                links.map((link: any) => (
                  <div key={link.id} className="link-card" onClick={() => router.push(`/link/${link.id}`)} style={{ cursor: 'pointer' }}>
                    <div className="vote-col" onClick={(e) => e.stopPropagation()}>
                      <button className="vote-btn up" onClick={(e) => handleVote(e, link.id, 1)}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                      </button>
                      <span className="vote-count">{link.upvote_count - link.downvote_count}</span>
                      <button className="vote-btn down" onClick={(e) => handleVote(e, link.id, -1)}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                      </button>
                    </div>
                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-domain">{new URL(link.original_url).hostname}</span>
                        <span className="card-poster" onClick={(e) => e.stopPropagation()}>
                          {link.is_anonymous ? <span className="anon-badge">anon</span> : <Link href={`/profile/${link.username}`}>@{link.username}</Link>}
                        </span>
                        <span className="card-time">{new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="card-title" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px' }}>{link.title}</div>
                      <div className="card-desc">{link.description}</div>
                      <div className="card-tags" onClick={(e) => e.stopPropagation()}>
                        {link.tags?.map((tag: string) => (
                          <Link key={tag} href={`/tags/${tag}`} className="tag">#{tag}</Link>
                        ))}
                      </div>
                      <div className="card-footer">
                        <div className="card-stat">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
                          {link.comment_count}
                        </div>
                        <span className="card-stat">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          {link.view_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
