'use client';

import React from 'react';
import Link from 'next/link';
import { TRENDING_TAGS } from './data';

export function MarqueeSection() {
  return (
    <section className="marquee-section">
      <div className="marquee-track">
        <div className="marquee-content">
          {TRENDING_TAGS.map(function(tag, i) {
            return <Link href={'/tags/' + tag.replace('#', '')} key={i} className="marquee-item">{tag}</Link>;
          })}
          {TRENDING_TAGS.map(function(tag, i) {
            return <Link href={'/tags/' + tag.replace('#', '')} key={'dup-' + i} className="marquee-item">{tag}</Link>;
          })}
        </div>
      </div>
    </section>
  );
}
