'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';
import FilterDropdown from '@/components/common/FilterDropdown';

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
        <div className="filter-row">
          {loadingCats ? (
            <div className="skel cat-skel-chip" />
          ) : (
            <FilterDropdown
              label="Category"
              value={activeCategory}
              options={categories.map((cat) => ({ value: cat.name, label: cat.name, count: cat.count }))}
              onChange={(value) => {
                if (!value) {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('category');
                  router.replace(`/categories${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
                  return;
                }
                if (value !== activeCategory) changeCategory(value);
              }}
              allLabel="All categories"
            />
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
