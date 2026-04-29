'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import { useRouter } from 'next/navigation';

export default function Submit() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState({ title: '', description: '', image: '', tags: '' });
  const [step, setStep] = useState(1); // 1: URL input, 2: Metadata/Tags

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
      setStep(2); // Still move to step 2 to allow manual entry
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
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
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

        <style jsx>{`
          .submit-card { 
            max-width: 500px; margin: 40px auto; 
            background: var(--bg-1); border: 1px solid var(--border); 
            border-radius: 12px; padding: 32px; 
          }
          .form-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: var(--text); }
          .form-sub { font-size: 13px; color: var(--text-4); margin-bottom: 24px; }
          .input-group { display: flex; gap: 8px; }
          .main-input { 
            flex: 1; padding: 12px 16px; background: var(--bg-2); 
            border: 1px solid var(--border); border-radius: 8px; 
            color: var(--text); font-size: 14px; outline: none;
          }
          .main-input:focus { border-color: var(--text-4); }
          .submit-btn { 
            padding: 0 20px; background: var(--text); color: var(--bg); 
            border-radius: 8px; font-weight: 500; font-size: 13px;
          }
          .input-group-v { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
          .input-group-v label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-4); }
          .sub-input { 
            padding: 10px 14px; background: var(--bg-2); 
            border: 1px solid var(--border); border-radius: 6px; 
            color: var(--text); font-size: 13px; outline: none;
          }
          .sub-input.textarea { min-height: 80px; resize: vertical; }
          .form-actions { display: flex; justify-content: space-between; margin-top: 24px; }
          .back-btn { font-size: 13px; color: var(--text-4); }
          .final-btn { 
            padding: 10px 20px; background: var(--text); color: var(--bg); 
            border-radius: 8px; font-weight: 500; font-size: 13px;
          }
        `}</style>
      </main>
    </div>
  );
}
