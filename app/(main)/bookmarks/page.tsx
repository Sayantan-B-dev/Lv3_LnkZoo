'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import LinkCard from '@/components/links/LinkCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login?from=/bookmarks'); return; }
    (async () => {
      const res = await fetch('/api/user/bookmarks');
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks.map((b: any) => ({ ...b, bookmarked_by_user: true })));
      }
      setLoading(false);
    })();
  }, [user, router]);

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
              <p style={{ fontSize: '12px', color: 'var(--text-4)', margin: '2px 0 0' }}>
                {loading ? '...' : `${bookmarks.length} saved link${bookmarks.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="loading-spinner" />
            </div>
          ) : bookmarks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              border: '1px dashed var(--border)', borderRadius: '12px',
              background: 'var(--bg-1)',
            }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" style={{ color: 'var(--text-4)', marginBottom: '16px', opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              <p style={{ fontSize: '14px', color: 'var(--text-4)', margin: 0 }}>
                No bookmarked links yet.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '6px', opacity: 0.7 }}>
                Click the bookmark icon on any link to save it here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bookmarks.map((link: any) => (
                <LinkCard key={link.id} link={link} variant="profile" />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
