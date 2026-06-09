'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationPanel() {
  const { notifications, unreadCount, isOpen, markAllRead } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="notif-panel open">
      <div className="notif-header">
        <span className="notif-title">Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
        <button className="notif-mark" onClick={markAllRead}>mark all read</button>
      </div>
      <div className="notif-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-4)', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span>No notifications yet</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="notif-item">
              <div className={`notif-dot-indicator ${n.is_read ? 'read' : ''}`}></div>
              <div>
                <div className="notif-text">
                  {n.actor_username && <b>@{n.actor_username} </b>}
                  {n.message}
                </div>
                <div className="notif-time">{new Date(n.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
