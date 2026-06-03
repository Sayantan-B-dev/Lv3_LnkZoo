'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import Link from 'next/link';
import LinkCard from '@/components/links/LinkCard';
import { useRouter } from 'next/navigation';

export default function TagPage({ params }: { params: { tag: string } }) {
  const { tag } = params;
  const router = useRouter();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/links?tag=${tag}`);
        if (res.ok) {
          const data = await res.json();
          setLinks(data.links);
        }
      } catch (err) {
        console.error('Failed to fetch links', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, [tag]);

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}/like`, { method: 'POST' });
      if (res.status === 401) {
        window.location.href = `/login?from=/tags/${tag}`;
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLinks(links.map((link: any) => (
          link.id === id
            ? { ...link, like_count: data.like_count, liked_by_user: data.liked }
            : link
        )));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="app">
      <CustomCursor />
      <Sidebar />
      <main id="main">
        <Topbar title={`#${tag}`} />
        <NotificationPanel />
        
        <div id="content">
          <div className="view active">
            <h2 className="section-title">Posts tagged with #{tag}</h2>
            
            <div id="home-feed">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="link-card" style={{ height: '120px' }}>
                    <div className="skel" style={{ width: '100%', height: '100%' }}></div>
                  </div>
                ))
              ) : links.length === 0 ? (
                <div className="empty">No posts found with this tag.</div>
              ) : (
                links.map((link: any) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    variant="full"
                    onLike={handleLike}
                  />
                ))
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
