'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import LinkCard from '@/components/links/LinkCard';
import SortDropdown from '@/components/common/SortDropdown';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('explore');
  const [sortBy, setSortBy] = useState('new');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLinks = async (query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/links?q=${encodeURIComponent(query)}`
        : `/api/links?tab=${activeTab}&sort=${sortBy}`;
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
  }, [activeTab, sortBy, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchLinks(searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}/like`, {
        method: 'POST',
      });
      if (res.status === 401) {
        router.push(`/login?from=/`);
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
    <>
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
            <div className="tabs-row">
              <div className="tabs">
                <button className={`tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>following</button>
                <button className={`tab ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>explore</button>
                <button className={`tab ${activeTab === 'recommended' ? 'active' : ''}`} onClick={() => setActiveTab('recommended')}>for you</button>
              </div>
              <SortDropdown value={sortBy} onChange={setSortBy} />
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
                <LinkCard
                  key={link.id}
                  link={link}
                  variant="full"
                  showPreview={true}
                  onLike={handleLike}
                  onClick={() => router.push(`/link/${link.id}`)}
                  isClickable={true}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
