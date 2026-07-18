'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';

function CategoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const apiEndpoint = useMemo(() => {
    if (!activeCategory) return null;
    return `/api/links?domain=${encodeURIComponent(activeCategory)}`;
  }, [activeCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/links/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  const changeCategory = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (name === activeCategory) {
      params.delete('category');
    } else {
      params.set('category', name);
    }
    router.replace(`/categories${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  return (
    <>
      <Topbar title="Categories" />
      <NotificationPanel />

      <div id="content" className="fade-in">
        <div className="filter-bar-scroll">
          {loadingCats ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skel cat-skel-chip" />
            ))
          ) : (
            categories.map((cat) => (
              <button
                key={cat.name}
                className={`cat-filter-chip ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => changeCategory(cat.name)}
              >
                {cat.name}
                <span className="cat-filter-count">{cat.count}</span>
              </button>
            ))
          )}
        </div>

        {activeCategory ? (
          <ScatteredLinks apiEndpoint={apiEndpoint!} />
        ) : !loadingCats && (
          <div className="empty cat-empty-mt">
            Select a category above to browse links
          </div>
        )}
      </div>
    </>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={null}>
      <CategoriesPageContent />
    </Suspense>
  );
}
