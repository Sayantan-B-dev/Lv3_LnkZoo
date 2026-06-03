'use client';

import React, { useState } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useRouter } from 'next/navigation';

export default function Submit() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState({ title: '', description: '', image: '', tags: '' });
  const [step, setStep] = useState(1);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tools/parse', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setMetadata({ ...metadata, title: data.title, description: data.description, image: data.image });
        setStep(2);
      }
    } catch (err) {
      console.error('Failed to parse URL', err);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        body: JSON.stringify({
          url,
          title: metadata.title,
          description: metadata.description,
          previewImage: metadata.image,
          tags: metadata.tags.split(',').map(t => t.trim()).filter(Boolean),
          isAnonymous: false,
          isPrivate: false,
        }),
      });
      if (res.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to post link', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar title="Post Link" />
      <NotificationPanel />
      
      <div id="content">
        <div className="submit-card">
          {step === 1 ? (
            <form onSubmit={handleUrlSubmit} className="submit-form">
              <h1 className="form-title">Share something interesting</h1>
              <p className="form-sub">Drop a URL and we'll handle the rest.</p>
              <div className="input-group">
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="main-input"
                  autoFocus
                />
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'fetching...' : 'Next →'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="submit-form">
              <div className="input-group-v">
                <label>Title</label>
                <input 
                  type="text" 
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  required
                  className="sub-input"
                />
              </div>
              <div className="input-group-v">
                <label>Description</label>
                <textarea 
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  className="sub-input textarea"
                />
              </div>
              <div className="input-group-v">
                <label>Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="webdev, javascript, design"
                  value={metadata.tags}
                  onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                  className="sub-input"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setStep(1)} className="back-btn">Back</button>
                <button type="submit" className="final-btn" disabled={loading}>
                  {loading ? 'Posting...' : 'Post to Community'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
