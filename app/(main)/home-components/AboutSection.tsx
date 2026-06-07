'use client';

import React from 'react';
import { Reveal } from './Reveal';

export function AboutSection({ stats }: { stats: any }) {
  return (
    <Reveal>
      <section className="about-section">
        <div className="about-ghost">01</div>
        <div className="about-grid">
          <div className="about-text">
            <h2 className="section-label">What is LnkZoo</h2>
            <h3 className="about-heading">A new way to share <br />and discover the web.</h3>
            <p className="about-desc">LnkZoo is a minimalist, community-focused platform where every link tells a story. Share your favorite discoveries, organize them with tags, follow curators you trust, and build a reputation through consistent, quality sharing.</p>
          </div>
          <div className="about-stats-grid">
            {[
              { val: (stats ? stats.totalLinks : 0).toLocaleString(), label: 'Links Shared' },
              { val: (stats ? stats.dailyActiveUsers : 0).toLocaleString(), label: 'Active Today' },
              { val: '50+', label: 'Communities' },
              { val: (stats ? stats.totalLikes : 0).toLocaleString(), label: 'Upvotes Given' },
            ].map(function(s, i) {
              return <div key={s.label} className="about-stat-card">
                <span className="about-stat-val">{s.val}</span>
                <span className="about-stat-lbl">{s.label}</span>
              </div>;
            })}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
