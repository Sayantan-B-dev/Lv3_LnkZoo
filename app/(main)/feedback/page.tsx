'use client';

import React, { useEffect, useState } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useToast } from '@/context/ToastContext';
import {
  FEEDBACK_ALLOWED_IMAGE_MIMES,
  FEEDBACK_MAX_DESCRIPTION,
  FEEDBACK_MAX_SCREENSHOT_BYTES,
  FEEDBACK_MAX_TITLE,
  FEEDBACK_MIN_DESCRIPTION,
  FEEDBACK_MIN_TITLE,
  FEEDBACK_STATUSES,
  feedbackStatusLabel,
} from '@/lib/feedbackRules';

interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  screenshot_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
  is_mine: boolean;
}

async function fetchFeedback(status: string | null) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/feedback${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function FeedbackPage() {
  const { addToast } = useToast();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchFeedback(statusFilter);
        if (cancelled) return;
        setItems(Array.isArray(data.feedback) ? data.feedback : []);
        setTotal(data.total ?? 0);
        setCounts(data.counts ?? {});
        setIsAdmin(!!data.isAdmin);
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

  // Release the blob URL for the previous screenshot whenever it is replaced.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const reload = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const changeFilter = (next: string | null) => {
    if (next === statusFilter) return;
    setLoading(true);
    setStatusFilter(next);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFormError(null);
    if (!picked) {
      clearFile();
      return;
    }
    if (!FEEDBACK_ALLOWED_IMAGE_MIMES.includes(picked.type.toLowerCase())) {
      setFormError('Screenshot must be a PNG, JPEG, WebP or GIF.');
      return;
    }
    if (picked.size > FEEDBACK_MAX_SCREENSHOT_BYTES) {
      setFormError('Screenshot must be 5MB or less.');
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < FEEDBACK_MIN_TITLE) {
      setFormError(`Give it a title of at least ${FEEDBACK_MIN_TITLE} characters.`);
      return;
    }
    if (trimmedDescription.length < FEEDBACK_MIN_DESCRIPTION) {
      setFormError('Describe what happened in a bit more detail.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append('title', trimmedTitle);
      fd.append('description', trimmedDescription);
      if (file) fd.append('screenshot', file);

      const res = await fetch('/api/feedback', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error || 'Could not submit feedback.');
        return;
      }
      setTitle('');
      setDescription('');
      clearFile();
      addToast('Thanks — report sent.', 'success');
      setStatusFilter(null);
      reload();
    } catch {
      setFormError('Could not submit feedback.');
    } finally {
      setSubmitting(false);
    }
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

  const canDelete = (item: FeedbackItem) => item.is_mine || isAdmin;

  return (
    <>
      <Topbar title="Feedback" />
      <NotificationPanel />

      <div id="content">
        <div className="view active feedback-page">
          <div className="feedback-head">
            <h2 className="feedback-heading">Report a bug</h2>
            <p className="feedback-sub">
              Found something broken? Describe it and attach a screenshot — it goes
              straight to the maintainer. No replies here, this is a report inbox.
            </p>
          </div>

          <form className="feedback-composer" onSubmit={handleSubmit}>
            <div className="feedback-field">
              <label className="feedback-label" htmlFor="fb-title">Title</label>
              <input
                id="fb-title"
                className="feedback-input"
                placeholder="Short summary — e.g. Upload fails on 4MB files"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={FEEDBACK_MAX_TITLE}
                required
              />
              <span className="feedback-counter">
                {title.length}/{FEEDBACK_MAX_TITLE}
              </span>
            </div>

            <div className="feedback-field">
              <label className="feedback-label" htmlFor="fb-desc">What happened?</label>
              <textarea
                id="fb-desc"
                className="feedback-textarea"
                placeholder="What you did, what you expected, what actually happened. Steps to reproduce help a lot."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={FEEDBACK_MAX_DESCRIPTION}
                rows={5}
                required
              />
              <span className="feedback-counter">
                {description.length}/{FEEDBACK_MAX_DESCRIPTION}
              </span>
            </div>

            <div className="feedback-field">
              <label className="feedback-label" htmlFor="fb-shot">
                Screenshot <span className="feedback-optional">(optional, max 5MB)</span>
              </label>
              <input
                id="fb-shot"
                type="file"
                accept={FEEDBACK_ALLOWED_IMAGE_MIMES.join(',')}
                onChange={handleFilePick}
                className="feedback-file"
              />
              {preview && (
                <div className="feedback-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Screenshot preview" className="feedback-preview-img" />
                  <button type="button" className="feedback-remove" onClick={clearFile}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {formError && <div className="feedback-error">{formError}</div>}

            <button type="submit" className="feedback-submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send report'}
            </button>
          </form>

          <div className="feedback-list-head">
            <h3 className="feedback-list-title">
              {isAdmin ? 'All reports' : 'Your reports'}
              {total > 0 && <span className="feedback-total">{total}</span>}
            </h3>
            <button className="feedback-refresh" onClick={reload} disabled={loading}>
              Refresh
            </button>
          </div>

          {isAdmin && (
            <div className="feedback-filters">
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
          )}

          {loading ? (
            <div className="feedback-skeleton">
              <div className="skel" style={{ height: '96px' }} />
              <div className="skel" style={{ height: '96px' }} />
            </div>
          ) : error ? (
            <div className="feedback-empty">
              {error}{' '}
              <button type="button" className="feedback-retry" onClick={reload}>Retry</button>
            </div>
          ) : items.length === 0 ? (
            <div className="feedback-empty">
              {isAdmin
                ? 'No reports yet.'
                : 'You have not sent any reports yet. Anything you submit shows up here.'}
            </div>
          ) : (
            <div className="feedback-list">
              {items.map((item) => (
                <article className="feedback-card" key={item.id}>
                  <div className="feedback-card-head">
                    <span className={`feedback-badge fb-status-${item.status}`}>
                      {feedbackStatusLabel(item.status)}
                    </span>
                    <h4 className="feedback-item-title">{item.title}</h4>
                  </div>

                  <div className="feedback-meta">
                    {isAdmin && (
                      <span className="feedback-author">
                        {item.username ? `@${item.username}` : 'deleted user'}
                      </span>
                    )}
                    <span>{formatWhen(item.created_at)}</span>
                    {item.updated_at !== item.created_at && (
                      <span className="feedback-updated">
                        updated {formatWhen(item.updated_at)}
                      </span>
                    )}
                  </div>

                  <p
                    className={`feedback-desc ${expandedId === item.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    {item.description}
                  </p>

                  {item.screenshot_url && (
                    <a
                      href={item.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="feedback-shot"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.screenshot_url} alt="Report screenshot" />
                    </a>
                  )}

                  <div className="feedback-actions">
                    {isAdmin && (
                      <select
                        className="feedback-status-select"
                        value={item.status}
                        onChange={(e) => handleStatus(item.id, e.target.value)}
                        disabled={busyId === item.id}
                        aria-label="Report status"
                      >
                        {FEEDBACK_STATUSES.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    )}
                    {canDelete(item) && (
                      <button
                        className="feedback-delete"
                        onClick={() => handleDelete(item.id)}
                        disabled={busyId === item.id}
                      >
                        {busyId === item.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
