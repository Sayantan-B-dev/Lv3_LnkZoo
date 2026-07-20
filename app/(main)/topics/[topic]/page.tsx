'use client';

import React, { useMemo, useState, useEffect, use } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';

interface TopicOption {
  slug: string;
  name: string;
}

interface TopicTypeGroup {
  slug: string;
  name: string;
  topics: TopicOption[];
}

export default function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = use(params);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/links/topics')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.types) return;
        for (const type of data.types as TopicTypeGroup[]) {
          const match = type.topics.find((t) => t.slug === topic);
          if (match) {
            setName(match.name);
            return;
          }
        }
      })
      .catch(() => {});
  }, [topic]);

  const apiEndpoint = useMemo(() => {
    return `/api/links?topic=${encodeURIComponent(topic)}`;
  }, [topic]);

  const label = name ?? topic;

  return (
    <>
      <Topbar title={label} />
      <NotificationPanel />

      <div id="content">
        <div className="view active">
          <h2 className="section-title">Links in {label}</h2>
          <ScatteredLinks apiEndpoint={apiEndpoint} />
        </div>
      </div>
    </>
  );
}
