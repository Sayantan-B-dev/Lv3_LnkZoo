'use client';

import { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/common/Topbar';
import ReflectiveCard from '@/components/react-bits/ReflectiveCard';

interface LinkItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  url: string;
  topicName?: string;
  topicColor?: string;
  username?: string;
}

export default function SwapPage() {
  const [page, setPage] = useState(1);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [batchSize] = useState(6);

  const fetchBatch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/links?sort=new&limit=${batchSize}&page=${p}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: LinkItem[] = (data.links || []).map((l: any) => ({
        id: String(l.id),
        title: l.title || 'Untitled',
        description: l.description,
        image: l.preview_image || undefined,
        url: `/link/${l.id}`,
        topicName: l.topic_name,
        topicColor: l.topic_color,
        username: l.username
      }));
      setLinks(items);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [batchSize]);

  useEffect(() => {
    fetchBatch(page);
  }, [page, fetchBatch]);

  const totalPages = Math.max(1, Math.ceil(total / batchSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const goNext = () => {
    if (safePage < totalPages) setPage(safePage + 1);
  };

  const goPrev = () => {
    if (safePage > 1) setPage(safePage - 1);
  };

  const openLink = (url: string) => {
    window.location.href = url;
  };

  return (
    <>
      <Topbar title="Swap" />

      <section className="swap-page">
        <div className="swap-header">
          <h1 className="swap-title">Card Swap</h1>
          <p className="swap-subtitle">
            {total} links &mdash; batch {safePage} of {totalPages} &middot; {links.length} in this stack
          </p>
        </div>

        <div className="swap-stage">
          {loading ? (
            <div className="swap-loading">Loading stack&hellip;</div>
          ) : links.length === 0 ? (
            <div className="swap-empty">No links in this batch.</div>
          ) : (
            <div className="swap-grid">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="swap-card-wrap"
                  onClick={() => openLink(link.url)}
                  style={{ cursor: 'pointer' }}
                >
                  <ReflectiveCard
                    name={link.title}
                    role={link.username ? `@${link.username}` : 'Anonymous'}
                    badge="Public"
                    status="Active"
                    statusColor={link.topicColor || '#22c55e'}
                    tint="#ffffff"
                    metalness={1}
                    roughness={0.3}
                    blurStrength={6}
                    grayscale={0}
                    warp={0.4}
                    warpScale={1}
                    shine={1}
                    bevel={2}
                    glare={0.4}
                    enableTilt
                    tiltStrength={8}
                    intro
                    width={320}
                    height={460}
                    radius={20}
                    className="swap-reflective-card"
                  >
                    {link.description && (
                      <div className="swap-card-desc">{link.description}</div>
                    )}
                  </ReflectiveCard>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="swap-controls">
          <button className="swap-page-btn" disabled={safePage <= 1} onClick={goPrev}>
            Prev batch
          </button>
          <span className="swap-page-info">
            {safePage} / {totalPages}
          </span>
          <button className="swap-page-btn swap-page-btn-next" disabled={safePage >= totalPages} onClick={goNext}>
            Next batch
          </button>
        </div>
      </section>
    </>
  );
}
