'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import Link from 'next/link';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredTags = tags.filter((t: any) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="app">
      <CustomCursor />
      
      <Sidebar />
      <main id="main">
        <Topbar title="Explore Tags" />
        
        <div id="content" className="fade-in">
          <div className="tags-header" style={{ marginBottom: '32px' }}>
            <div className="search-bar" style={{ maxWidth: '400px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
              <input 
                type="text" 
                placeholder="Search tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '14px', width: '100%' }}
              />
            </div>
          </div>

          <div className="section-title">{searchQuery ? `Matching Tags (${filteredTags.length})` : 'Trending Tags'}</div>
          
          <div className="tag-grid">
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <div key={i} className="tag-skeleton" />)
            ) : filteredTags.length === 0 ? (
              <div className="empty">No tags matching "{searchQuery}"</div>
            ) : (
              filteredTags.map((tag: any) => (
                <Link href={`/tags/${tag.name}`} key={tag.id} className="tag-large">
                  <span className="tag-name">#{tag.name}</span>
                  <span className="tag-count">{tag.usage_count} posts</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
