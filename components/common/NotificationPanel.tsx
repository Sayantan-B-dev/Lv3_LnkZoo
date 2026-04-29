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
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-4)', fontSize: '11px' }}>
            No notifications yet
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
