'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Topbar from '@/components/common/Topbar';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';
import SortDropdown from '@/components/common/SortDropdown';
import FilterDropdown from '@/components/common/FilterDropdown';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('new');
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [topicTypes, setTopicTypes] = useState<{ slug: string; name: string; link_count: number }[]>([]);
  const [activeTopicType, setActiveTopicType] = useState<string | null>(null);

  const apiEndpoint = useMemo(() => {
    let url = `/api/links?sort=${sortBy}`;
    if (activeCategory) url += `&domain=${encodeURIComponent(activeCategory)}`;
    if (activeTopicType) url += `&topicType=${encodeURIComponent(activeTopicType)}`;
    return url;
  }, [sortBy, activeCategory, activeTopicType]);

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
    const fetchTopics = async () => {
      try {
        const res = await fetch('/api/links/topics');
        if (res.ok) {
          const data = await res.json();
          setTopicTypes(data.types ?? []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
    fetchTopics();
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
            {(categories.length > 0 || topicTypes.length > 0) && (
              <div className="filter-row">
                {categories.length > 0 && (
                  <FilterDropdown
                    label="Category"
                    value={activeCategory}
                    options={categories.map((cat) => ({ value: cat.name, label: cat.name, count: cat.count }))}
                    onChange={setActiveCategory}
                  />
                )}
                {topicTypes.length > 0 && (
                  <FilterDropdown
                    label="Topic"
                    value={activeTopicType}
                    options={topicTypes.map((t) => ({ value: t.slug, label: t.name, count: t.link_count }))}
                    onChange={setActiveTopicType}
                  />
                )}
              </div>
            )}
            <ScatteredLinks key={apiEndpoint} apiEndpoint={apiEndpoint} />
          </section>
        )}
      </div>
    </>
  );
}
