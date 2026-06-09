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
  const { user, loading: authLoading } = useAuth();
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
    if (authLoading) return;
    if (!user) { router.push('/login?from=/notifications'); return; }
    fetchNotifs();
  }, [user, authLoading]);

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
        <div className="notif-page-container">
          <div className="notif-page-header">
            <h2 className="notif-page-title">
              {unread > 0 ? `Notifications (${unread})` : 'Notifications'}
            </h2>
            {unread > 0 && (
              <button onClick={markAllRead} className="ml-bulk-btn">
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="notif-page-loading">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="notif-page-empty">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="notif-page-list">
              {notifications.map(n => (
                <Link
                  key={n.id}
                  href={notifLink(n)}
                  className={`notif-page-item${n.is_read ? '' : ' unread'}`}
                >
                  <span className="notif-page-item-icon">{typeIcon(n.type)}</span>
                  <div className="notif-page-item-body">
                    <span>{n.message}</span>
                    <div className="notif-page-item-meta">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span className="notif-page-item-dot" />
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
