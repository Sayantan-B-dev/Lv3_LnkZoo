'use client';

import React from 'react';
import Sidebar from '@/components/common/Sidebar';
import CustomCursor from '@/components/common/CustomCursor';
import { Footer } from '@/components/common/Footer';
import { MobileMenuProvider, useMobileMenu } from '@/context/MobileMenuContext';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useMobileMenu();

  return (
    <div id="app">
      <CustomCursor />
      <Sidebar isOpen={isOpen} onClose={close} />
      <main id="main">
        {children}
        <Footer />
      </main>
      {isOpen && (
        <div id="mobile-overlay" className="show" onClick={close} />
      )}
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileMenuProvider>
      <LayoutInner>{children}</LayoutInner>
    </MobileMenuProvider>
  );
}
