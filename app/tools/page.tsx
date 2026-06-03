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

      </main>
    </div>
  );
}
