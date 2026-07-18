'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';

interface UserEntry {
  id: string;
  username: string;
  avatar_url?: string;
  streak: number;
  link_count: number;
  like_count: number;
}

export default function Users() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const limit = 24;

  const fetchUsers = async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${p}&limit=${limit}&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1, search); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Topbar title="Users" />
      <NotificationPanel />

      <div id="content">
        <div className="users-header">
          <div>
            <h1 className="users-title">Users</h1>
            <p className="users-sub">{total.toLocaleString()} total members</p>
          </div>
          <form onSubmit={handleSearch} className="users-search">
            <svg className="users-search-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="users-search-input"
            />
          </form>
        </div>

        {loading ? (
          <div className="users-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="user-card skel" style={{ height: '140px', borderRadius: '10px' }} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">No users found</div>
        ) : (
          <div className="users-grid">
            {users.map((u) => (
              <Link key={u.id} href={`/profile/${u.username}`} className="user-card">
                <div className="user-card-avatar">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.username} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = u.username.slice(0, 2).toUpperCase(); }} />
                    : u.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="user-card-name">@{u.username}</div>
                <div className="user-card-stats">
                  <div className="user-card-stat">
                    <span className="user-card-stat-num">{u.link_count}</span>
                    <span className="user-card-stat-label">Links</span>
                  </div>
                  <div className="user-card-stat">
                    <span className="user-card-stat-num">{u.like_count}</span>
                    <span className="user-card-stat-label">Likes</span>
                  </div>
                  <div className="user-card-stat">
                    <span className="user-card-stat-num">{u.streak}d</span>
                    <span className="user-card-stat-label">Streak</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="users-pagination">
            <button
              disabled={page <= 1}
              onClick={() => fetchUsers(page - 1, search)}
              className="users-page-btn"
            >
              Previous
            </button>
            <span className="users-page-info">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchUsers(page + 1, search)}
              className="users-page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
