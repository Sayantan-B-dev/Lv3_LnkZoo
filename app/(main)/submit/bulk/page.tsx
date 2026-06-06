'use client';

import React, { useState, useRef } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import '../../../../styles/pages/submit-bulk.css';

interface UploadResult {
  url: string;
  success: boolean;
  title?: string;
  shortCode?: string;
  error?: string;
}

export default function BulkUpload() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; succeeded: number; failed: number; limitApplied: boolean } | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = user?.role === 'admin';
  const maxUrls = isAdmin ? Infinity : 10;
  const urls = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && /^https?:\/\//i.test(l));

  const exceeded = urls.length > maxUrls;

  const downloadReport = () => {
    if (!results || !summary) return;
    const ts = new Date().toLocaleString();
    const lines = [
      'Bulk Upload Report',
      '==================',
      `Date: ${ts}`,
      `Total: ${summary.total}`,
      `Succeeded: ${summary.succeeded}`,
      `Failed: ${summary.failed}`,
      '',
      'Results:',
      '--------',
      ...results.map((r, i) => {
        const status = r.success ? 'OK' : 'FAIL';
        const code = r.success && r.shortCode ? `https://lnkzoo.vercel.app/s/${r.shortCode}` : '-';
        const title = r.title || '-';
        return `${i + 1}. [${status}] ${title}  ${code}  ${r.url}`;
      }),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bulk-upload-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSubmit = async () => {
    if (urls.length === 0 || exceeded) return;
    setLoading(true);
    setProgress(0);
    setResults(null);
    setSummary(null);

    try {
      const res = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) {
        addToast('Upload failed — server error', 'error');
        setSummary({ total: urls.length, succeeded: 0, failed: urls.length, limitApplied: false });
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'progress') {
              setProgress(data.processed);
            } else if (data.type === 'done') {
              setResults(data.results);
              setSummary({
                total: data.total,
                succeeded: data.succeeded,
                failed: data.failed,
                limitApplied: data.limitApplied,
              });
              if (data.failed === 0) {
                addToast(`All ${data.succeeded} links uploaded successfully!`, 'success');
              } else {
                addToast(`${data.succeeded} uploaded, ${data.failed} failed`, 'error');
              }
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch {
      setSummary({ total: urls.length, succeeded: 0, failed: urls.length, limitApplied: false });
      addToast('Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar title="Bulk Upload" />
      <NotificationPanel />

      <div id="content">
        <div className="bulk-card">
          <div className="bulk-header">
            <div>
              <h1 className="bulk-title">Bulk Upload</h1>
              <p className="bulk-sub">
                Paste URLs, one per line.{' '}
                {isAdmin
                  ? 'Unlimited uploads — 5 concurrent threads.'
                  : `Max 10 URLs at once.`}
              </p>
            </div>
            <div className="bulk-badge-row">
              {isAdmin && <span className="bulk-badge bulk-badge-admin">Admin</span>}
              {!isAdmin && <span className="bulk-badge bulk-badge-user">User</span>}
            </div>
          </div>

          {!results && (
            <>
              <div className="bulk-input-area">
                <textarea
                  ref={textRef}
                  className="bulk-textarea"
                  placeholder="https://example.com/article-1&#10;https://example.com/article-2&#10;https://example.com/article-3"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  disabled={loading}
                  rows={8}
                />
              </div>

              <div className="bulk-footer">
                <div className="bulk-count">
                  <span className="bulk-count-num">{urls.length}</span> URL{urls.length !== 1 ? 's' : ''} detected
                  {exceeded && (
                    <span className="bulk-count-warn">
                      — max {maxUrls} per upload
                    </span>
                  )}
                </div>
                <button
                  className="bulk-start-btn"
                  onClick={handleSubmit}
                  disabled={urls.length === 0 || exceeded || loading}
                >
                  {loading ? 'Uploading...' : 'Start Upload'}
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="bulk-progress">
              <div className="bulk-progress-bar">
                <div className="bulk-progress-fill" style={{ width: `${(progress / urls.length) * 100}%` }} />
              </div>
              <div className="bulk-progress-text">
                <div className="bulk-progress-spinner" />
                Processing {progress}/{urls.length} URLs with 5 concurrent threads...
              </div>
            </div>
          )}

          {results && summary && (
            <div className="bulk-results">
              <div className="bulk-summary">
                <div className="bulk-summary-stat ok">
                  <span className="bulk-summary-num">{summary.succeeded}</span>
                  <span className="bulk-summary-label">Succeeded</span>
                </div>
                {summary.failed > 0 && (
                  <div className="bulk-summary-stat fail">
                    <span className="bulk-summary-num">{summary.failed}</span>
                    <span className="bulk-summary-label">Failed</span>
                  </div>
                )}
                <div className="bulk-summary-stat">
                  <span className="bulk-summary-num">{summary.total}</span>
                  <span className="bulk-summary-label">Total</span>
                </div>
                {summary.limitApplied && (
                  <div className="bulk-summary-notice">
                    Limited to first 10 URLs (user limit).
                  </div>
                )}
              </div>

              <div className="bulk-results-table-wrap">
                <table className="bulk-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}></th>
                      <th>Title</th>
                      <th style={{ width: '100px' }}>Short Code</th>
                      <th style={{ width: '80px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className={r.success ? '' : 'bulk-row-fail'}>
                        <td>
                          {r.success ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                          )}
                        </td>
                        <td>
                          <div className="bulk-result-title">{r.title || r.url}</div>
                          <div className="bulk-result-url">{r.url}</div>
                        </td>
                        <td>
                          {r.success && r.shortCode ? (
                            <code className="bulk-code">{r.shortCode}</code>
                          ) : (
                            <span className="bulk-result-na">—</span>
                          )}
                        </td>
                        <td>
                          {r.success ? (
                            <span className="bulk-status-ok">Done</span>
                          ) : (
                            <span className="bulk-status-fail">{r.error || 'Failed'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bulk-actions">
                <button className="bulk-back-btn" onClick={() => { setResults(null); setRaw(''); setSummary(null); }}>
                  Upload More
                </button>
                <button className="bulk-dl-btn" onClick={downloadReport}>
                  Download Report
                </button>
                <button className="bulk-home-btn" onClick={() => router.push('/')}>
                  Go Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
