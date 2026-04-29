'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import { useRouter } from 'next/navigation';

export default function Explore() {
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [latestLinks, setLatestLinks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tagsRes, linksRes] = await Promise.all([
          fetch('/api/tags'),
          fetch('/api/links?sort=new&limit=10')
        ]);
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          setTags(data.tags);
        }
        if (linksRes.ok) {
          const data = await linksRes.json();
          setLatestLinks(data.links);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const performSearch = async () => {
          setSearching(true);
          try {
            const res = await fetch(`/api/links?q=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
              const data = await res.json();
              setSearchResults(data.links);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setSearching(false);
          }
        };
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div id="app">
      <CustomCursor />
      
      <Sidebar />
      <main id="main">
        <Topbar title="Explore" />
        
        <div id="content" className="fade-in">
          <section className="search-section">
            <div className="search-bar">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
              <input 
                type="text" 
                placeholder="Search links by title or tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '14px', width: '100%' }}
              />
            </div>
          </section>

          {searchQuery ? (
            <section className="explore-section">
              <h2 className="section-title">{searching ? 'Searching...' : `Search results for "${searchQuery}"`}</h2>
              <div className="search-list">
                {searchResults.length === 0 && !searching ? (
                  <div className="empty">No matches found.</div>
                ) : (
                  searchResults.map((link: any) => (
                    <div key={link.id} className="link-card mini" onClick={() => router.push(`/link/${link.id}`)} style={{ cursor: 'pointer' }}>
                      <div className="card-body">
                        <div className="card-title">{link.title}</div>
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
          ) : (
            <>
              <section className="explore-section">
                <h2 className="section-title">Popular Tags</h2>
                <div className="tag-cloud">
                  {loading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="skel" style={{ width: '80px', height: '32px', borderRadius: '6px' }}></div>
                    ))
                  ) : (
                    tags.map((tag: any) => (
                      <Link key={tag.id} href={`/tags/${tag.name}`} className="tag-item">
                        <span className="tag-name">#{tag.name}</span>
                        <span className="tag-count">{tag.usage_count}</span>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <section className="explore-section">
                <h2 className="section-title">Latest Discoveries</h2>
                <div className="latest-list">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="link-card mini skel" style={{ height: '60px' }}></div>
                    ))
                  ) : (
                    latestLinks.map((link: any) => (
                      <div key={link.id} className="link-card mini" onClick={() => router.push(`/link/${link.id}`)} style={{ cursor: 'pointer' }}>
                        <div className="card-body">
                          <div className="card-title">{link.title}</div>
                          <div className="card-meta">
                            <span className="card-domain">{new URL(link.original_url).hostname}</span>
                            <span className="card-time">{new Date(link.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <style jsx>{`
          .search-section { margin-bottom: 32px; }
          .search-bar { 
            display: flex; align-items: center; gap: 12px; padding: 12px 20px; 
            background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); transition: all 0.2s;
          }
          .search-bar:focus-within { border-color: var(--text-4); background: var(--bg-2); }
          
          .explore-section { margin-bottom: 40px; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); margin-bottom: 16px; }
          .tag-cloud { display: flex; flex-wrap: wrap; gap: 10px; }
          .tag-item { 
            display: flex; align-items: center; gap: 8px; 
            padding: 8px 16px; background: var(--bg-1); 
            border: 1px solid var(--border); border-radius: 8px;
            transition: all 0.2s; cursor: pointer;
          }
          .tag-item:hover { border-color: var(--text-4); transform: translateY(-2px); background: var(--bg-2); }
          .tag-name { font-size: 13px; color: var(--text-2); font-weight: 500; }
          .tag-count { font-size: 11px; color: var(--text-4); }
          
          .latest-list, .search-list { display: flex; flex-direction: column; gap: 12px; }
          .link-card.mini { padding: 16px; background: var(--bg-1); border: 1px solid var(--border); border-radius: 10px; transition: all 0.2s; }
          .link-card.mini:hover { border-color: var(--text-4); background: var(--bg-2); }
          .link-card.mini .card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
          .link-card.mini .card-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-4); }
        `}</style>
      </main>
    </div>
  );
}
