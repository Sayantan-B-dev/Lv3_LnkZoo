'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: number;
  type: string;
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_username?: string;
  actor_avatar?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optional: Polling or WebSocket setup here
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={useMemo(() => ({
        notifications,
        unreadCount,
        loading,
        isOpen,
        setIsOpen,
        fetchNotifications,
        markAllRead,
      }), [notifications, unreadCount, loading, isOpen, setIsOpen, fetchNotifications, markAllRead])}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
