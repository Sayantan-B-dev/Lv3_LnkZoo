'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Topbar from '@/components/common/Topbar';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';
import SortDropdown from '@/components/common/SortDropdown';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('new');
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCatFilter, setShowCatFilter] = useState(false);

  const apiEndpoint = useMemo(() => {
    let url = `/api/links?sort=${sortBy}`;
    if (activeCategory) url += `&domain=${encodeURIComponent(activeCategory)}`;
    return url;
  }, [sortBy, activeCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/links/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories ?? []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

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
            <h2 className="section-title">{`Search results for "${searchQuery}"`}</h2>
            <ScatteredLinks apiEndpoint={`/api/links?q=${encodeURIComponent(searchQuery)}`} />
          </section>
        ) : (
          <section className="explore-section">
            <div className="section-header-row">
              <h2 className="section-title">Discover</h2>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
            {categories.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <button
                  onClick={() => setShowCatFilter(v => !v)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer',
                    fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0'
                  }}
                >
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"
                    style={{ transform: showCatFilter ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M8 5l8 7-8 7z" />
                  </svg>
                  Filter by category {activeCategory && <span style={{ color: 'var(--accent)' }}>({activeCategory})</span>}
                </button>
                {showCatFilter && (
                  <div className="filter-bar-scroll" style={{ marginTop: '8px' }}>
                    <button
                      className={`cat-filter-chip ${!activeCategory ? 'active' : ''}`}
                      onClick={() => setActiveCategory(null)}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        className={`cat-filter-chip ${activeCategory === cat.name ? 'active' : ''}`}
                        onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                      >
                        {cat.name}
                        <span className="cat-filter-count">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <ScatteredLinks apiEndpoint={apiEndpoint} />
          </section>
        )}
      </div>
    </>
  );
}
