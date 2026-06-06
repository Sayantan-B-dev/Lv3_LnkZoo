'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import '../../styles/pages/admin.css';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg> },
  { href: '/admin/users', label: 'Users', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg> },
  { href: '/submit/bulk', label: 'Bulk Upload', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5M3.75 4.5l3 3M3.75 4.5l-3 3M17.25 4.5l3 3M3 12h18M3 12l3 3M3 12l-3 3M17.25 12l3 3M3 19.5h18M3 19.5l3 3M3 19.5l-3 3M17.25 19.5l3 3"/></svg> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (pathname === '/admin/forbidden') {
    return <>{children}</>;
  }

  if (!user || user.role !== 'admin') {
    router.replace('/admin/forbidden');
    return null;
  }

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <Link href="/">lnkzoo</Link>
          <span className="admin-badge">Admin</span>
        </div>
        <nav className="admin-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-item ${pathname === link.href ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-back-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
            Back to Site
          </Link>
        </div>
      </aside>
      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
