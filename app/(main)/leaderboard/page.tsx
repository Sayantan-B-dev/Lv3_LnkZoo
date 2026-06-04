'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';

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
    <>
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
            <span className="stats">Likes</span>
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
              <Link key={user.id} href={`/profile/${user.username}`} className={`leaderboard-row ${userRank?.id === user.id ? 'is-me' : ''}`}>
                <span className="rank">{index + 1}</span>
                <div className="user-cell">
                  <div className="avatar mini">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.username} /> : user.username.slice(0, 2)}
                  </div>
                  <span className="username" style={{ color: 'var(--text-2)', fontWeight: '500' }}>
                    @{user.username}
                  </span>
                  {user.streak > 0 && (
                    <span className="streak" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 2C11.5 2 11.5 7 9 9C6.5 11 4 14 4 17C4 20 6 22 9 22C12 22 13 20 13 20C13 20 14 22 18 22C21 22 22 20 22 17C22 14 18 9 18 9C18 9 18 6 15.5 4C13 2 11.5 2 11.5 2Z"/></svg>
                      {user.streak}d
                    </span>
                  )}
                </div>
                <span className="stats likes">{user.like_count.toLocaleString()}</span>
                <span className="stats">{user.link_count}</span>
              </Link>
            ))
          )}
          
          {!loading && userRank && userRank.rank > 20 && (
            <>
              <div className="leaderboard-divider">•••</div>
              <Link href={`/profile/${userRank.username}`} className="leaderboard-row is-me">
                <span className="rank">{userRank.rank}</span>
                <div className="user-cell">
                  <div className="avatar mini">
                    {userRank.avatar_url ? <img src={userRank.avatar_url} alt={userRank.username} /> : userRank.username.slice(0, 2)}
                  </div>
                  <span className="username" style={{ color: 'var(--text-2)', fontWeight: '500' }}>
                    @{userRank.username} (You)
                  </span>
                  {userRank.streak > 0 && (
                    <span className="streak" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 2C11.5 2 11.5 7 9 9C6.5 11 4 14 4 17C4 20 6 22 9 22C12 22 13 20 13 20C13 20 14 22 18 22C21 22 22 20 22 17C22 14 18 9 18 9C18 9 18 6 15.5 4C13 2 11.5 2 11.5 2Z"/></svg>
                    {userRank.streak}d
                  </span>
                  )}
                </div>
                <span className="stats likes">{userRank.like_count.toLocaleString()}</span>
                <span className="stats">{userRank.link_count}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
