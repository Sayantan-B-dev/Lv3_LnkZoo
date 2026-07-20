'use client';

import React, { useState, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import Link from 'next/link';

interface TopicOption {
  id: number;
  slug: string;
  name: string;
  color: string | null;
  link_count: number;
}

interface TopicTypeGroup {
  id: number;
  slug: string;
  name: string;
  color: string | null;
  link_count: number;
  topics: TopicOption[];
}

export default function TopicsPage() {
  const [types, setTypes] = useState<TopicTypeGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/links/topics')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.types) setTypes(data.types);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Topics" />

      <div id="content" className="fade-in">
        <div className="section-title" style={{ marginBottom: '24px' }}>
          Browse by topic
        </div>

        {loading ? (
          <div className="empty">Loading topics...</div>
        ) : types.length === 0 ? (
          <div className="empty">No topics yet.</div>
        ) : (
          types.map((type) => (
            <section key={type.id} className="topic-type-section">
              <div
                className="topic-type-header"
                style={type.color ? ({ '--topic-color': type.color } as React.CSSProperties) : undefined}
              >
                <span className="topic-type-name">{type.name}</span>
                <span className="topic-type-count">{type.link_count}</span>
              </div>
              <div className="topic-chip-row">
                {type.topics.map((t) => (
                  <Link
                    key={t.id}
                    href={`/topics/${t.slug}`}
                    className="card-topic-badge topic-chip"
                    style={t.color ? ({ '--topic-color': t.color } as React.CSSProperties) : undefined}
                  >
                    {t.name}
                    <span className="topic-chip-count">{t.link_count}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
