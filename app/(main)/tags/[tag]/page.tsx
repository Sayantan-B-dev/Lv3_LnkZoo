'use client';

import React, { useMemo, use } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';

export default function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = use(params);

  const apiEndpoint = useMemo(() => {
    return `/api/links?tag=${encodeURIComponent(tag)}`;
  }, [tag]);

  return (
    <>
      <Topbar title={`#${tag}`} />
      <NotificationPanel />
      
      <div id="content">
        <div className="view active">
          <h2 className="section-title">Posts tagged with #{tag}</h2>
          <ScatteredLinks apiEndpoint={apiEndpoint} />
        </div>
      </div>
    </>
  );
}
