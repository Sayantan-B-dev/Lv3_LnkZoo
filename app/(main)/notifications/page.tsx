'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_username: string | null;
  actor_avatar: string | null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { router.push('/login?from=/notifications'); return; }
    fetchNotifs();
  }, [user]);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnread(0);
        addToast('Marked all as read', 'success');
      }
    } catch {
      addToast('Failed to mark as read', 'error');
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'like': return '\u2764\uFE0F';
      case 'reply': return '\uD83D\uDCAC';
      case 'follow': return '\uD83D\uDC64';
      case 'mention': return '\uD83D\uDEA9';
      case 'flag': return '\u26A0\uFE0F';
      default: return '\uD83D\uDD14';
    }
  };

  const notifLink = (n: Notification) => {
    if (n.type === 'follow') return `/profile/${n.actor_username ?? ''}`;
    return `/link/${n.entity_id}`;
  };

  return (
    <>
      <Topbar title="Notifications" />
      <NotificationPanel />

      <div id="content">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {unread > 0 ? `Notifications (${unread})` : 'Notifications'}
            </h2>
            {unread > 0 && (
              <button onClick={markAllRead} className="ml-bulk-btn" style={{ fontSize: '12px', padding: '6px 14px' }}>
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-4)' }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-4)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>\uD83D\uDD14</div>
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {notifications.map(n => (
                <Link
                  key={n.id}
                  href={notifLink(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: n.is_read ? 'var(--bg-1)' : 'color-mix(in srgb, var(--accent) 5%, var(--bg-1))',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    textDecoration: 'none',
                    transition: 'background var(--t)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'var(--bg-1)' : 'color-mix(in srgb, var(--accent) 5%, var(--bg-1))')}
                >
                  <span style={{ fontSize: '16px' }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span>{n.message}</span>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
