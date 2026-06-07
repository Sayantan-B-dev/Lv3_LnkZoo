'use client';

import { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ConfirmModal from '@/components/common/ConfirmModal';
import StatsCards from '@/components/manage/StatsCards';
import LinkTable from '@/components/manage/LinkTable';
import BulkActionBar from '@/components/manage/BulkActionBar';
import BulkTagModal from '@/components/manage/BulkTagModal';
import Pagination from '@/components/manage/Pagination';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import '../../../../styles/pages/manage-links.css';

export default function ManageLinks() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [links, setLinks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, order });
      if (q) params.set('q', q);

      const [linksRes, statsRes] = await Promise.all([
        fetch(`/api/user/links?${params}`),
        fetch('/api/user/links/stats'),
      ]);

      if (linksRes.ok) {
        const data = await linksRes.json();
        setLinks(data.links ?? []);
        setTotal(data.total ?? 0);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch {
      addToast('Failed to load links', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, q, addToast]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleSort = (col: string) => {
    if (sort === col) {
      setOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(col);
      setOrder('desc');
    }
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setQ(val);
    setPage(1);
  };

  const handleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === links.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(links.map(l => l.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    try {
      const res = await fetch('/api/user/links/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        addToast(`Deleted ${ids.length} link${ids.length > 1 ? 's' : ''}`, 'success');
        setSelected(new Set());
        setShowDeleteConfirm(false);
        fetchLinks();
      } else {
        addToast('Failed to delete links', 'error');
      }
    } catch {
      addToast('Failed to delete links', 'error');
    }
  };

  const handleBulkVisibility = async (visibility: string) => {
    const ids = Array.from(selected);
    try {
      const res = await fetch('/api/user/links/bulk-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, visibility }),
      });
      if (res.ok) {
        addToast(`Updated ${ids.length} link${ids.length > 1 ? 's' : ''} to ${visibility}`, 'success');
        setSelected(new Set());
        fetchLinks();
      } else {
        addToast('Failed to update visibility', 'error');
      }
    } catch {
      addToast('Failed to update visibility', 'error');
    }
  };

  const handleBulkTag = async (addTags: string[], removeTags: string[]) => {
    const ids = Array.from(selected);
    try {
      const res = await fetch('/api/user/links/bulk-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, addTags, removeTags }),
      });
      if (res.ok) {
        addToast('Tags updated', 'success');
        setSelected(new Set());
        setShowTagModal(false);
        fetchLinks();
      } else {
        addToast('Failed to update tags', 'error');
      }
    } catch {
      addToast('Failed to update tags', 'error');
    }
  };

  return (
    <>
      <Topbar title="My Links" />
      <NotificationPanel />

      <div id="content">
        <div className="ml-page">
          <StatsCards stats={stats} />

          <BulkActionBar
            selectedCount={selected.size}
            onDelete={() => setShowDeleteConfirm(true)}
            onVisibility={handleBulkVisibility}
            onTag={() => setShowTagModal(true)}
          />

          <div className="ml-toolbar">
            <input
              className="ml-search"
              placeholder="Search your links..."
              value={q}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="ml-loading">Loading...</div>
          ) : (
            <>
              <LinkTable
                links={links}
                selected={selected}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                sort={sort}
                order={order}
                onSort={handleSort}
              />
              <div className="ml-pagination-wrap">
                <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
                <select
                  className="ml-limit-select"
                  value={limit}
                  onChange={e => handleLimitChange(Number(e.target.value))}
                >
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          message={`Delete ${selected.size} link${selected.size > 1 ? 's' : ''}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showTagModal && (
        <BulkTagModal
          onConfirm={handleBulkTag}
          onCancel={() => setShowTagModal(false)}
        />
      )}
    </>
  );
}
