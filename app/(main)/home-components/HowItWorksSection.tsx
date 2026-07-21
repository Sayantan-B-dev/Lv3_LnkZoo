'use client';

import React from 'react';
import { Reveal } from './Reveal';

const CARD_DATA = [
  {
    num: '01',
    title: 'Categories',
    tagline: 'Domain-specific filtering',
    desc: 'Think of categories as broad neighbourhoods — tech, art, science, gaming, and more. They act as a first-pass filter so you can narrow the feed to a specific domain. Every link lives under exactly one category.',
  },
  {
    num: '02',
    title: 'Topics',
    tagline: '60 curated collections',
    desc: 'Inside each category, topics are pre-defined, editor-curated buckets (60 in total). When you post a link you assign it a topic — this keeps the feed organised without the chaos of free-form labels. Think "CSS" under Tech, or "Oil Painting" under Art.',
  },
  {
    num: '03',
    title: 'Tags',
    tagline: 'Free-form, user-defined — use sparingly',
    desc: 'Tags are ad-hoc keywords you invent on the fly. They\'re flexible but can get chaotic — "webdev", "web-dev", "web development" all coexist. Use tags for micro-categorisation that the curated topics don\'t cover, but prefer topics for discoverability.',
  },
];

const RowIcon = ({ num }: { num: string }) => {
  const n = parseInt(num);
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <rect x="1" y="1" width="40" height="40" rx="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">{num}</text>
    </svg>
  );
};

export function HowItWorksSection() {
  return (
    <Reveal>
      <section className="hiw-section">
        <div className="about-ghost">04</div>
        <h2 className="section-label" style={{ textAlign: 'center', marginBottom: '8px' }}>How It Works</h2>
        <h3 className="features-heading">Categories, Topics &amp; Tags — <br />what each one does.</h3>

        <div className="hiw-rows">
          {CARD_DATA.map((item) => (
            <div key={item.num} className="hiw-row">
              <div className="hiw-row-icon"><RowIcon num={item.num} /></div>
              <div className="hiw-row-body">
                <div className="hiw-row-header">
                  <h4 className="hiw-row-title">{item.title}</h4>
                  <span className="hiw-row-tagline">{item.tagline}</span>
                </div>
                <p className="hiw-row-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
