'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  return (
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
        <Topbar title="Leaderboard" />
        <NotificationPanel />
        
        <div id="content">
          <div className="tabs">
            <button className={`tab ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>week</button>
            <button className={`tab ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>month</button>
            <button className={`tab ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>all time</button>
          </div>

          <div className="leaderboard-list">
            <div className="leaderboard-header">
              <span className="rank">#</span>
              <span className="user">User</span>
              <span className="stats">Karma</span>
              <span className="stats">Links</span>
            </div>

            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="leaderboard-row skel-row">
                   <div className="skel" style={{ width: '100%', height: '32px' }}></div>
                </div>
              ))
            ) : (
              users.map((user: any, index: number) => (
                <div key={user.id} className="leaderboard-row">
                  <span className="rank">{index + 1}</span>
                  <div className="user-cell">
                    <div className="avatar mini">
                      {user.avatar_url ? <img src={user.avatar_url} alt={user.username} /> : user.username.slice(0, 2)}
                    </div>
                    <Link href={`/profile/${user.username}`} className="username" style={{ color: 'var(--text-2)', fontWeight: '500' }}>
                      @{user.username}
                    </Link>
                    {user.streak > 0 && <span className="streak">🔥 {user.streak}d</span>}
                  </div>
                  <span className="stats karma">{user.karma.toLocaleString()}</span>
                  <span className="stats">{user.link_count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <style jsx>{`
          .leaderboard-list { background: var(--bg-1); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
          .leaderboard-header { 
            display: grid; grid-template-columns: 50px 1fr 100px 80px; 
            padding: 12px 16px; border-bottom: 1px solid var(--border);
            font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4);
          }
          .leaderboard-row { 
            display: grid; grid-template-columns: 50px 1fr 100px 80px; 
            padding: 12px 16px; border-bottom: 1px solid var(--border);
            align-items: center; transition: background 0.2s;
          }
          .leaderboard-row:last-child { border-bottom: none; }
          .leaderboard-row:hover { background: var(--bg-2); }
          .rank { font-size: 12px; color: var(--text-4); font-weight: 500; }
          .user-cell { display: flex; align-items: center; gap: 10px; overflow: hidden; }
          .avatar.mini { width: 24px; height: 24px; font-size: 9px; }
          .username { font-size: 13px; font-weight: 500; color: var(--text-2); }
          .streak { font-size: 10px; color: #ff8a00; }
          .stats { font-size: 12px; color: var(--text-3); }
          .stats.karma { color: var(--text); font-weight: 500; }
          .skel-row { padding: 8px 16px; border-bottom: 1px solid var(--border); }
        `}</style>
      </main>
    </div>
  );
}
