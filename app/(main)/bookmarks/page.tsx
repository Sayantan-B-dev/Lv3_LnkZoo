'use client';

import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BookmarksPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/login?from=/bookmarks'); }
  }, [user, router]);

  if (!user) return null;

  return (
    <>
      <Topbar title="Bookmarks" />
      <NotificationPanel />
      <div id="content">
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '24px', paddingBottom: '16px',
            borderBottom: '1px solid var(--border)',
          }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Bookmarks</h2>
            </div>
          </div>
          <ScatteredLinks apiEndpoint="/api/user/bookmarks" />
        </div>
      </div>
    </>
  );
}
