'use client';

import React from 'react';
import Link from 'next/link';

interface TagBadgeProps {
  tag: string;
  showHash?: boolean;
  count?: number;
}

export default function TagBadge({ tag, showHash = true, count }: TagBadgeProps) {
  return (
    <Link href={`/tags/${tag}`} className="tag">
      {showHash && '#'}{tag}
      {count !== undefined && <span className="tag-count">{count}</span>}
    </Link>
  );
}
