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
  const [userRank, setUserRank] = useState<any>(null);
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
          setUserRank(data.userRank);
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
                <div key={user.id} className={`leaderboard-row ${userRank?.id === user.id ? 'is-me' : ''}`}>
                  <span className="rank">{index + 1}</span>
                  <div className="user-cell">
                    <div className="avatar mini">
                      {user.avatar_url ? <img src={user.avatar_url} alt={user.username} /> : user.username.slice(0, 2)}
                    </div>
                    <Link href={`/profile/${user.username}`} className="username" style={{ color: 'var(--text-2)', fontWeight: '500' }}>
                      @{user.username}
                    </Link>
                    {user.streak > 0 && (
                      <span className="streak" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 2C11.5 2 11.5 7 9 9C6.5 11 4 14 4 17C4 20 6 22 9 22C12 22 13 20 13 20C13 20 14 22 18 22C21 22 22 20 22 17C22 14 18 9 18 9C18 9 18 6 15.5 4C13 2 11.5 2 11.5 2Z"/></svg>
                        {user.streak}d
                      </span>
                    )}
                  </div>
                  <span className="stats karma">{user.karma.toLocaleString()}</span>
                  <span className="stats">{user.link_count}</span>
                </div>
              ))
            )}
            
            {!loading && userRank && userRank.rank > 20 && (
              <>
                <div className="leaderboard-divider">•••</div>
                <div className="leaderboard-row is-me">
                  <span className="rank">{userRank.rank}</span>
                  <div className="user-cell">
                    <div className="avatar mini">
                      {userRank.avatar_url ? <img src={userRank.avatar_url} alt={userRank.username} /> : userRank.username.slice(0, 2)}
                    </div>
                    <Link href={`/profile/${userRank.username}`} className="username" style={{ color: 'var(--text-2)', fontWeight: '500' }}>
                      @{userRank.username} (You)
                    </Link>
                    {userRank.streak > 0 && (
                      <span className="streak" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 2C11.5 2 11.5 7 9 9C6.5 11 4 14 4 17C4 20 6 22 9 22C12 22 13 20 13 20C13 20 14 22 18 22C21 22 22 20 22 17C22 14 18 9 18 9C18 9 18 6 15.5 4C13 2 11.5 2 11.5 2Z"/></svg>
                        {userRank.streak}d
                      </span>
                    )}
                  </div>
                  <span className="stats karma">{userRank.karma.toLocaleString()}</span>
                  <span className="stats">{userRank.link_count}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .leaderboard-list { background: color-mix(in srgb, var(--bg-1) 45%, transparent); backdrop-filter: blur(8px); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
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
          .leaderboard-row.is-me { background: rgba(255,255,255,0.05); border-left: 2px solid var(--text-4); }
          .leaderboard-row:last-child { border-bottom: none; }
          .leaderboard-row:hover { background: var(--bg-2); }
          .leaderboard-divider { text-align: center; padding: 8px; color: var(--text-4); font-size: 12px; background: var(--bg-1); }
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
