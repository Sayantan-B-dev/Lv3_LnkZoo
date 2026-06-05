'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import { MobileMenuProvider, useMobileMenu } from '@/context/MobileMenuContext';

function NotFoundInner() {
  const { isOpen, close } = useMobileMenu();

  return (
    <div id="app">
      <CustomCursor />
      <Sidebar isOpen={isOpen} onClose={close} />
      <main id="main">
        <Topbar title="404 — Not Found" />
        <div id="content" className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}>
          <div className="error-code" style={{ fontSize: '120px', fontWeight: '800', opacity: '0.05', position: 'absolute', zIndex: -1 }}>404</div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>Lost in the grid?</h1>
          <p style={{ color: 'var(--text-4)', fontSize: '14px', marginBottom: '32px', maxWidth: '400px' }}>
            The link you're looking for doesn't exist or has been moved to another dimension.
          </p>
          <Link href="/" className="back-home">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '8px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Back to safety
          </Link>
        </div>
      </main>
      {isOpen && (
        <div id="mobile-overlay" className="show" onClick={close} />
      )}
    </div>
  );
}

export default function NotFound() {
  return (
    <MobileMenuProvider>
      <NotFoundInner />
    </MobileMenuProvider>
  );
}
