'use client';

import React from 'react';
import Link from 'next/link';
import { ShortenIcon, FileTransferIcon, TextShareIcon, MetaScraperIcon } from './icons';

const HERO_TOOLS = [
  { icon: ShortenIcon, name: 'URL Shortener', desc: 'Short links + QR', href: '/tools#url-shortener', soon: false },
  { icon: FileTransferIcon, name: 'File Transfer', desc: 'Self-destructs in 5 min', href: '/tools#file-transfer', soon: false },
  { icon: TextShareIcon, name: 'Text Share', desc: 'Expiring secret text', href: '/tools#text-share', soon: false },
  { icon: MetaScraperIcon, name: 'Meta Scraper', desc: 'OG tags & metadata', href: '/tools', soon: true },
];

export function HeroTools() {
  return (
    <div className="hero-tools">
      <div className="hero-tools-head">
        <span className="hero-tools-label">Free tools included</span>
        <Link href="/tools" className="hero-tools-all">View all →</Link>
      </div>
      <div className="hero-tools-grid">
        {HERO_TOOLS.map(function(tool, i) {
          var inner = (
            <>
              <span className="hero-tool-icon">{React.createElement(tool.icon)}</span>
              <span className="hero-tool-body">
                <span className="hero-tool-name">
                  {tool.name}
                  {tool.soon && <span className="hero-tool-badge">Soon</span>}
                </span>
                <span className="hero-tool-desc">{tool.desc}</span>
              </span>
            </>
          );
          var cls = 'hero-tool-card' + (tool.soon ? ' is-soon' : '');
          var style = { animationDelay: 0.4 + i * 0.08 + 's' };
          return tool.soon
            ? <div key={tool.name} className={cls} style={style}>{inner}</div>
            : <Link key={tool.name} href={tool.href} className={cls} style={style}>{inner}</Link>;
        })}
      </div>
    </div>
  );
}
