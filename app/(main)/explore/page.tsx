'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import LinkCard from '@/components/links/LinkCard';
import SortDropdown from '@/components/common/SortDropdown';
import { useRouter } from 'next/navigation';

export default function Explore() {
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [latestLinks, setLatestLinks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('new');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tagsRes, linksRes] = await Promise.all([
          fetch('/api/tags'),
          fetch(`/api/links?sort=${sortBy}&limit=10`)
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
  }, [sortBy]);

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
    <>
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
                  <LinkCard
                    key={link.id}
                    link={link}
                    variant="mini"
                    showPreview={true}
                    showComments={true}
                    onClick={() => router.push(`/link/${link.id}`)}
                    isClickable={true}
                  />
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
              <div className="section-header-row">
                <h2 className="section-title">Latest Discoveries</h2>
                <SortDropdown value={sortBy} onChange={setSortBy} />
              </div>
              <div className="latest-list">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="link-card mini skel" style={{ height: '60px' }}></div>
                  ))
                ) : (
                  latestLinks.map((link: any) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      variant="mini"
                      showPreview={true}
                      showVotes={false}
                      showComments={false}
                      onClick={() => router.push(`/link/${link.id}`)}
                      isClickable={true}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
