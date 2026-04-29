'use client';

import React from 'react';
import Link from 'next/link';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <CustomCursor />
      <AnimatedBg />
      <div className="nf-content">
        <h1 className="nf-code">404</h1>
        <h2 className="nf-title">Lost in the grid?</h2>
        <p className="nf-desc">The link you're looking for doesn't exist or has been moved.</p>
        <Link href="/" className="nf-btn">Back to safety</Link>
      </div>

      <style jsx>{`
        .not-found-page { 
          min-height: 100vh; display: flex; align-items: center; justify-content: center; 
          background: var(--bg); color: var(--text); padding: 20px; text-align: center;
        }
        .nf-content { z-index: 1; }
        .nf-code { font-size: 80px; font-weight: 700; color: var(--text-4); margin-bottom: 8px; letter-spacing: -2px; }
        .nf-title { font-size: 24px; font-weight: 600; margin-bottom: 12px; }
        .nf-desc { font-size: 14px; color: var(--text-3); margin-bottom: 32px; max-width: 300px; margin-inline: auto; line-height: 1.6; }
        .nf-btn { 
          display: inline-block; padding: 10px 24px; background: var(--text); color: var(--bg); 
          border-radius: 8px; font-weight: 500; font-size: 13px; transition: opacity 0.2s;
        }
        .nf-btn:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}
