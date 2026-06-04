'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  streak: number;
  is_banned: boolean;
  created_at: string;
  link_count: number;
}

const roleColors: Record<string, string> = {
  admin: '#ef4444',
  prouser: '#f59e0b',
  user: '#3b82f6',
};

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="adm-metric" style={{ padding: '16px 20px' }}>
      <div className="adm-metric-value" style={{ fontSize: '24px' }}>{value}</div>
      <div className="adm-metric-label">{label}</div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users?page=${p}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch {
      alert('Failed to update role');
    }
  };

  const handleBanToggle = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/ban/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: current ? 'unban' : 'ban' }),
      });
      if (!res.ok) throw new Error('Failed');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !current } : u));
    } catch {
      alert('Failed to update ban status');
    }
  };

  const totalPages = Math.ceil(total / limit);
  const admins = users.filter(u => u.role === 'admin').length;
  const banned = users.filter(u => u.is_banned).length;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Users</h1>
          <p className="adm-page-sub">{total.toLocaleString()} total users</p>
        </div>
      </div>

      <div className="adm-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label="Total" value={total} color="#3b82f6" />
        <StatCard label="Admins" value={admins} color="#ef4444" />
        <StatCard label="Banned" value={banned} color="#dc2626" />
        <StatCard label="Page" value={`${page} / ${totalPages || 1}`} color="#10b981" />
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="adm-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Links</th>
                <th>Streak</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="adm-empty" style={{ padding: '48px !important' }}>Loading users...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="adm-user-row">
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-user-avatar">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" /> : u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="adm-user-name">@{u.username}</div>
                        {u.bio && <div className="adm-user-bio">{u.bio.slice(0, 40)}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="adm-cell-muted">{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="adm-role-select"
                      style={{ borderColor: `${roleColors[u.role]}40`, color: roleColors[u.role] }}
                    >
                      <option value="user">user</option>
                      <option value="prouser">prouser</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="adm-cell-num">{u.link_count}</td>
                  <td className="adm-cell-num">
                    <span className="adm-streak">{u.streak}d</span>
                  </td>
                  <td>
                    {u.is_banned ? (
                      <span className="adm-badge-danger">Banned</span>
                    ) : (
                      <span className="adm-badge-ok">Active</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`adm-action-btn ${u.is_banned ? 'adm-action-ok' : 'adm-action-danger'}`}
                      onClick={() => handleBanToggle(u.id, u.is_banned)}
                    >
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="adm-pagination">
          <button disabled={page <= 1} onClick={() => fetchUsers(page - 1)} className="adm-page-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            Previous
          </button>
          <div className="adm-page-dots">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : Math.max(1, Math.min(page - 3, totalPages - 6)) + i;
              return (
                <button key={p} className={`adm-page-dot ${p === page ? 'active' : ''}`} onClick={() => fetchUsers(p)}>{p}</button>
              );
            })}
          </div>
          <button disabled={page >= totalPages} onClick={() => fetchUsers(page + 1)} className="adm-page-btn">
            Next
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
