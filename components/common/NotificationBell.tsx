'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { unreadCount, setIsOpen, isOpen } = useNotifications();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <button
      className={`notif-bell ${className} ${unreadCount > 0 ? 'has-unread' : ''}`}
      onClick={handleToggle}
      title="Notifications"
    >
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );
}
