'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import LinkCard from '@/components/links/LinkCard';

const LIMIT_OPTIONS = [20, 50, 100];

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

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

  const fetchLinks = useCallback(async (category: string, p: number, lim: number) => {
    setLoadingLinks(true);
    try {
      const res = await fetch(`/api/links?domain=${encodeURIComponent(category)}&page=${p}&limit=${lim}`);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch links', err);
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  const changeCategory = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (name === activeCategory) {
      params.delete('category');
    } else {
      params.set('category', name);
    }
    router.replace(`/categories${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    setPage(1);
  };

  useEffect(() => {
    if (activeCategory) {
      fetchLinks(activeCategory, page, limit);
    } else {
      setLinks([]);
      setTotal(0);
    }
  }, [activeCategory, page, limit, fetchLinks]);

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}/like`, { method: 'POST' });
      if (res.status === 401) {
        router.push(`/login?from=/categories${activeCategory ? `?category=${activeCategory}` : ''}`);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLinks(links.map((link: any) => (
          link.id === id
            ? { ...link, like_count: data.like_count, liked_by_user: data.liked }
            : link
        )));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pageNumbers.push(i);
    }
  }

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

        {activeCategory && (
          <div className="category-grid cat-grid-mt">
            {loadingLinks ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="link-card cat-link-skel">
                  <div className="skel cat-skel-fill"></div>
                </div>
              ))
            ) : links.length === 0 ? (
              <div className="empty">No links found for {activeCategory}.</div>
            ) : (
              links.map((link: any) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  variant="mini"
                  showPreview={true}
                  showDescription={true}
                  onLike={handleLike}
                />
              ))
            )}
          </div>
        )}

        {activeCategory && totalPages > 1 && !loadingLinks && (
          <div className="cat-pagination">
            <div className="cat-limit-group">
              <span className="cat-limit-label">Per page:</span>
              <select
                className="ml-limit-select"
                value={limit}
                onChange={handleLimitChange}
              >
                {LIMIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="cat-page-btns">
              <button
                className="cat-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              {pageNumbers.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && pageNumbers[i - 1] !== p - 1 && (
                    <span className="cat-page-ellipsis">...</span>
                  )}
                  <button
                    className={`cat-page-num ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
              <button
                className="cat-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>

            <span className="cat-total">{total} total</span>
          </div>
        )}

        {!activeCategory && !loadingCats && (
          <div className="empty cat-empty-mt">
            Select a category above to browse links
          </div>
        )}
      </div>
    </>
  );
}
