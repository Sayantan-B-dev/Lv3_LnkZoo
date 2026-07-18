'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useRouter } from 'next/navigation';

export default function DailyDose() {
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDose = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/links/daily-dose');
        if (res.ok) {
          const data = await res.json();
          if (data.links && data.links.length > 0) {
            setLinks(data.links);
            setLoading(false);
            return;
          }
        }
        // fallback: fetch 5 random links
        const randRes = await fetch('/api/links/random?limit=5');
        if (randRes.ok) {
          const randData = await randRes.json();
          setLinks(randData.links || []);
        }
      } catch (err) {
        console.error('Failed to fetch daily dose', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDose();
  }, []);

  return (
    <>
      <Topbar title="Daily Dose" />
      <NotificationPanel />
      
      <div id="content">
        <div className="dose-header">
          <h1 className="dose-title">The Daily Dose</h1>
          <p className="dose-sub">Top 5 links from the last 24 hours, hand-picked by the community.</p>
        </div>

        <div className="dose-list">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="link-card" style={{ height: '140px' }}><div className="skel" style={{ width: '100%', height: '100%' }}></div></div>
            ))
          ) : links.length === 0 ? (
            <div className="empty">No links available right now.</div>
          ) : (
            links.map((link: any, index: number) => {
              const domain = link.original_url ? new URL(link.original_url).hostname : '';
              return (
                <div key={link.id} className="dose-link-card" onClick={() => router.push(`/link/${link.id}`)}>
                  <div className="dose-number">{String(index + 1).padStart(2, '0')}</div>
                  <div className="dose-link-body">
                    <span className="dose-link-domain">{domain}</span>
                    <div className="dose-link-title">{link.title || 'Untitled'}</div>
                    {link.description && <div className="dose-link-desc">{link.description}</div>}
                    <div className="dose-link-footer">
                      {link.username && <span className="dose-link-poster">@{link.username}</span>}
                    </div>
                  </div>
                  {link.preview_image && (
                    <div className="dose-link-img">
                      <img src={link.preview_image} alt={link.title || ''} onError={(e) => { (e.target as HTMLImageElement).src = '/fall-back-image.webp'; }} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
