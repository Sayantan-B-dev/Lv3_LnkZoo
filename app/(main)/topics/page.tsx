'use client';

import React, { useState, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import TopicsPlayground from '@/components/topics/TopicsPlayground';

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
          <TopicsPlayground types={types} />
        )}
      </div>
    </>
  );
}
