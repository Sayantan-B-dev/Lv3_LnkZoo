'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', avatar_url: '', website: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const cleanUsername = username.replace(/^@/, '');
      setLoading(true);
      try {
        const [profRes, linksRes] = await Promise.all([
          fetch(`/api/users/${cleanUsername}`),
          fetch(`/api/users/${cleanUsername}/links`)
        ]);
        if (profRes.ok && linksRes.ok) {
          const profData = await profRes.json();
          const linksData = await linksRes.json();
          setProfile(profData.user);
          setLinks(linksData.links);
          setEditData({
            bio: profData.user.bio || '',
            avatar_url: profData.user.avatar_url || '',
            website: profData.user.website || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, ...data.user });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/links/${linkId}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks(links.filter((l: any) => l.id !== linkId));
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

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

  if (loading) return null;

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
          {isEditing ? (
            <div className="profile-header editing">
              <h2 className="section-title">Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} className="edit-form">
                <div className="input-group-v">
                  <label>Avatar URL</label>
                  <input value={editData.avatar_url} onChange={e => setEditData({...editData, avatar_url: e.target.value})} className="auth-input" />
                </div>
                <div className="input-group-v">
                  <label>Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="auth-input" style={{ minHeight: '80px' }} />
                </div>
                <div className="input-group-v">
                  <label>Website</label>
                  <input value={editData.website} onChange={e => setEditData({...editData, website: e.target.value})} className="auth-input" />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
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
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
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
          )}

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
                      <Link href={`/link/${link.id}`} className="card-title" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px', display: 'block' }}>
                        {link.title}
                      </Link>
                      <div className="card-footer" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <span className="card-stat">▲ {link.upvote_count}</span>
                          <span className="card-stat">💬 {link.comment_count}</span>
                        </div>
                        {currentUser?.username === profile.username && (
                          <button onClick={() => handleDeleteLink(link.id)} className="delete-btn">Delete</button>
                        )}
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
          .edit-btn, .follow-btn, .save-btn, .cancel-btn { 
            padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; 
            transition: all 0.2s; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); cursor: pointer;
          }
          .save-btn { background: var(--text); color: var(--bg); border-color: var(--text); }
          .follow-btn.active { background: var(--text); color: var(--bg); border-color: var(--text); }
          .delete-btn { font-size: 11px; color: #ff5555; background: none; border: none; cursor: pointer; opacity: 0.7; }
          .delete-btn:hover { opacity: 1; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); margin-bottom: 20px; }
          .edit-form { display: flex; flex-direction: column; gap: 16px; max-width: 500px; }
          .input-group-v { display: flex; flex-direction: column; gap: 8px; }
          .input-group-v label { font-size: 11px; color: var(--text-4); text-transform: uppercase; }
          .auth-input { padding: 10px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 13px; outline: none; }
        `}</style>
      </main>
    </div>
  );
}
