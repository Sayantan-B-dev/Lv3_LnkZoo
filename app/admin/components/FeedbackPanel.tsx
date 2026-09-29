'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  FEEDBACK_STATUSES,
  feedbackStatusLabel,
  feedbackVisibilityLabel,
} from '@/lib/feedbackRules';

interface AdminFeedbackItem {
  id: number;
  title: string;
  screenshot_url: string | null;
  status: string;
  visibility: string;
  created_at: string;
  username: string | null;
}

const PANEL_LIMIT = 50;

async function loadFeedback(status: string | null) {
  const qs = new URLSearchParams({ limit: String(PANEL_LIMIT) });
  if (status) qs.set('status', status);
  const res = await fetch(`/api/feedback?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function FeedbackPanel() {
  const { addToast } = useToast();

  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await loadFeedback(statusFilter);
        if (cancelled) return;
        setItems(Array.isArray(data.feedback) ? data.feedback : []);
        setCounts(data.counts ?? {});
        setTotal(data.total ?? 0);
        setError(null);
      } catch {
        if (!cancelled) setError('Could not load feedback.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [statusFilter, refreshKey]);

  const changeFilter = (next: string | null) => {
    if (next === statusFilter) return;
    setLoading(true);
    setStatusFilter(next);
  };

  const handleStatus = async (id: number, status: string) => {
    setBusyId(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      addToast(`Marked ${feedbackStatusLabel(status)}`, 'success');
    } catch {
      addToast('Failed to update status', 'error');
    } finally {
      setBusyId(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      addToast('Report deleted', 'success');
      setRefreshKey((k) => k + 1);
    } catch {
      addToast('Failed to delete', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="adm-chart-card adm-chart-full">
      <div className="adm-chart-header">
        <span className="adm-chart-title">Feedback</span>
        <span className="adm-chart-total">
          {counts.open ?? 0} open / {total} shown
        </span>
      </div>

      <div className="fb-admin-filters">
        <button
          className={`feedback-chip ${statusFilter === null ? 'active' : ''}`}
          onClick={() => changeFilter(null)}
        >
          All
        </button>
        {FEEDBACK_STATUSES.map((option) => (
          <button
            key={option.id}
            className={`feedback-chip ${statusFilter === option.id ? 'active' : ''}`}
            onClick={() => changeFilter(option.id)}
          >
            <span className={`fb-dot fb-status-${option.id}`} />
            {option.label}
            <span className="feedback-chip-count">{counts[option.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="fb-admin-skeleton">
          <div className="skel" style={{ height: '38px' }} />
          <div className="skel" style={{ height: '38px' }} />
          <div className="skel" style={{ height: '38px' }} />
        </div>
      ) : error ? (
        <div className="adm-empty">{error}</div>
      ) : (
        <div className="fb-admin-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Report</th>
                <th>Author</th>
                <th>Visibility</th>
                <th>When</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <select
                      className={`fb-admin-status fb-status-${item.status}`}
                      value={item.status}
                      onChange={(e) => handleStatus(item.id, e.target.value)}
                      disabled={busyId === item.id}
                      aria-label={`Status for ${item.title}`}
                    >
                      {FEEDBACK_STATUSES.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="adm-td-title">
                    <div className="fb-admin-title">{item.title}</div>
                    {item.screenshot_url && (
                      <a
                        href={item.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="fb-admin-shot"
                      >
                        screenshot ↗
                      </a>
                    )}
                  </td>
                  <td className="fb-admin-author">
                    {item.username ? `@${item.username}` : 'deleted'}
                  </td>
                  <td>
                    <span className={`feedback-vis feedback-vis-${item.visibility}`}>
                      {feedbackVisibilityLabel(item.visibility)}
                    </span>
                  </td>
                  <td className="fb-admin-when">{formatWhen(item.created_at)}</td>
                  <td className="fb-admin-actions">
                    <button
                      className="fb-admin-del"
                      onClick={() => handleDelete(item.id)}
                      disabled={busyId === item.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-empty">
                    {statusFilter ? 'Nothing with that status' : 'No feedback yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
