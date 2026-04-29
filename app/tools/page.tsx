'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

export default function Tools() {
  const [url, setUrl] = useState('');
  const [shortResult, setShortResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tools/shorten', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setShortResult(data);
      }
    } catch (err) {
      console.error('Shorten failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
        <Topbar title="Developer Tools" />
        <NotificationPanel />
        
        <div id="content">
          <div className="tool-grid">
            <div className="tool-card">
              <h2 className="tool-title">URL Shortener</h2>
              <p className="tool-desc">Create clean, trackable short links for your projects.</p>
              <form onSubmit={handleShorten} className="tool-form">
                <input 
                  type="url" 
                  placeholder="Paste long URL..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="tool-input"
                  required
                />
                <button type="submit" className="tool-btn" disabled={loading}>
                  {loading ? '...' : 'Shorten'}
                </button>
              </form>

              {shortResult && (
                <div className="tool-result">
                  <div className="result-label">Your short link:</div>
                  <div className="result-box">
                    <span>{shortResult.shortUrl}</span>
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText(shortResult.shortUrl)}>Copy</button>
                  </div>
                </div>
              )}
            </div>

            <div className="tool-card disabled">
              <h2 className="tool-title">Meta Scraper</h2>
              <p className="tool-desc">Extract OG tags and metadata from any website.</p>
              <div className="coming-soon">Coming Soon</div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .tool-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
          .tool-card { background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
          .tool-card.disabled { opacity: 0.6; pointer-events: none; }
          .tool-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--text); }
          .tool-desc { font-size: 13px; color: var(--text-4); margin-bottom: 20px; line-height: 1.5; }
          .tool-form { display: flex; gap: 8px; }
          .tool-input { 
            flex: 1; padding: 10px 14px; background: var(--bg-2); 
            border: 1px solid var(--border); border-radius: 6px; 
            color: var(--text); font-size: 13px; outline: none;
          }
          .tool-btn { 
            padding: 0 16px; background: var(--text); color: var(--bg); 
            border-radius: 6px; font-size: 12px; font-weight: 500;
          }
          .tool-result { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
          .result-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-4); margin-bottom: 8px; }
          .result-box { 
            display: flex; align-items: center; justify-content: space-between; 
            background: var(--bg-2); border: 1px solid var(--border); 
            padding: 8px 12px; border-radius: 6px; font-size: 13px; color: var(--text-2);
          }
          .copy-btn { font-size: 11px; color: var(--text-4); cursor: pointer; }
          .copy-btn:hover { color: var(--text); }
          .coming-soon { 
            display: inline-block; padding: 4px 10px; background: var(--bg-3); 
            border-radius: 4px; font-size: 10px; font-weight: 600; 
            text-transform: uppercase; color: var(--text-4);
          }
        `}</style>
      </main>
    </div>
  );
}
