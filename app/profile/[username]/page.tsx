'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profRes, linksRes] = await Promise.all([
          fetch(`/api/users/${username}`),
          fetch(`/api/users/${username}/links`)
        ]);
        if (profRes.ok && linksRes.ok) {
          const profData = await profRes.json();
          const linksData = await linksRes.json();
          setProfile(profData.user);
          setLinks(linksData.links);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, isFollowing: data.following });
      }
    } catch (err) {
      console.error('Follow failed', err);
    }
  };

  if (loading) return null; // Or skeleton

  if (!profile) return (
    <div id="app">
      <Sidebar />
      <main id="main"><Topbar title="Not Found" /><div id="content">User not found.</div></main>
    </div>
  );

  return (
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
        <Topbar title={`@${profile.username}`} />
        <NotificationPanel />
        
        <div id="content">
          <div className="profile-header">
            <div className="profile-top">
              <div className="avatar large">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} /> : profile.username.slice(0, 2)}
              </div>
              <div className="profile-info">
                <h1 className="profile-name">@{profile.username}</h1>
                <p className="profile-bio">{profile.bio || 'No bio yet.'}</p>
                <div className="profile-stats">
                  <span className="stat-item"><b>{profile.karma}</b> karma</span>
                  <span className="stat-item"><b>{profile.link_count}</b> posts</span>
                  <span className="stat-item"><b>{profile.follower_count}</b> followers</span>
                </div>
              </div>
              <div className="profile-actions">
                {currentUser?.username === profile.username ? (
                  <button className="edit-btn">Edit Profile</button>
                ) : (
                  <button 
                    className={`follow-btn ${profile.isFollowing ? 'active' : ''}`}
                    onClick={handleFollow}
                  >
                    {profile.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="profile-content" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Submissions</h2>
            <div className="profile-links">
              {links.length === 0 ? (
                <div className="empty">No public posts yet.</div>
              ) : (
                links.map((link: any) => (
                  <div key={link.id} className="link-card">
                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-domain">{new URL(link.original_url).hostname}</span>
                        <span className="card-time">{new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="card-title">{link.title}</div>
                      <div className="card-footer">
                        <span className="card-stat">▲ {link.upvote_count}</span>
                        <span className="card-stat">💬 {link.comment_count}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .profile-header { background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 32px; }
          .profile-top { display: flex; gap: 24px; align-items: flex-start; }
          .avatar.large { width: 80px; height: 80px; font-size: 24px; }
          .profile-info { flex: 1; }
          .profile-name { font-size: 24px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
          .profile-bio { font-size: 14px; color: var(--text-3); margin-bottom: 16px; line-height: 1.6; max-width: 500px; }
          .profile-stats { display: flex; gap: 20px; }
          .stat-item { font-size: 13px; color: var(--text-4); }
          .stat-item b { color: var(--text-2); font-weight: 500; }
          .edit-btn, .follow-btn { 
            padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; 
            transition: all 0.2s; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2);
          }
          .follow-btn.active { background: var(--text); color: var(--bg); border-color: var(--text); }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); margin-bottom: 20px; }
        `}</style>
      </main>
    </div>
  );
}
