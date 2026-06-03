'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import LinkCard from '@/components/links/LinkCard';

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
          setLinks(data.links);
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
            <div className="empty">The community was quiet today. check back soon!</div>
          ) : (
            links.map((link: any, index: number) => (
              <LinkCard
                key={link.id}
                link={link}
                variant="dose"
                doseNumber={index + 1}
                showPoster={true}
                showDescription={true}
                showPreview={true}
                onClick={() => router.push(`/link/${link.id}`)}
                isClickable={true}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
