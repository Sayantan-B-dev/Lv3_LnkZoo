'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import { useAuth } from '@/context/AuthContext';
import Cropper from 'react-easy-crop';

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(resolve => image.onload = resolve);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return canvas.toDataURL('image/jpeg', 0.9);
};

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const { user: currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', avatar_url: '', cover_url: '', website: '' });

  const [cropState, setCropState] = useState<{ imageSrc: string | null, crop: any, zoom: number, type: 'avatar' | 'cover' | null }>({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [showPopup, setShowPopup] = useState<'followers' | 'following' | null>(null);
  const [popupUsers, setPopupUsers] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);

  const cleanUsername = username.replace(/^@/, '');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profRes, linksRes] = await Promise.all([
        fetch(`/api/users/${cleanUsername}`, { cache: 'no-store' }),
        fetch(`/api/users/${cleanUsername}/links`, { cache: 'no-store' })
      ]);
      if (profRes.ok && linksRes.ok) {
        const profData = await profRes.json();
        const linksData = await linksRes.json();
        setProfile(profData.user);
        setLinks(linksData.links);
        setEditData({
          bio: profData.user.bio || '',
          avatar_url: profData.user.avatar_url || '',
          cover_url: profData.user.cover_url || '',
          website: profData.user.website || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setCropState({ imageSrc: reader.result as string, crop: { x: 0, y: 0 }, zoom: 1, type });
      };
    }
  };

  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUploadCroppedImage = async () => {
    if (!cropState.imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const base64Image = await getCroppedImg(cropState.imageSrc, croppedAreaPixels);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, folder: `glinx_${cropState.type}s` })
      });
      if (res.ok) {
        const { url } = await res.json();
        if (cropState.type === 'avatar') setEditData({ ...editData, avatar_url: url });
        if (cropState.type === 'cover') setEditData({ ...editData, cover_url: url });
        setCropState({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
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

  const handleFollow = async () => {
    if (!currentUser) return window.location.href = '/login';
    try {
      const res = await fetch(`/api/users/${cleanUsername}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProfile({ 
          ...profile, 
          isFollowing: data.following,
          follower_count: data.following ? profile.follower_count + 1 : profile.follower_count - 1
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPopup = async (type: 'followers' | 'following') => {
    setShowPopup(type);
    setPopupLoading(true);
    try {
      const res = await fetch(`/api/users/${cleanUsername}/${type}`);
      if (res.ok) {
        const data = await res.json();
        setPopupUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPopupLoading(false);
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
      <Sidebar />
      <main id="main">
        <Topbar title={`@${profile.username}`} />
        <NotificationPanel />
        
        <div id="content" className="fade-in">
          {isEditing ? (
            <div className="profile-header editing">
              {editData.cover_url && <img src={editData.cover_url} className="cover-image-bg" alt="Cover" />}
              <h2 className="section-title" style={{ position: 'relative', zIndex: 1 }}>Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} className="edit-form" style={{ position: 'relative', zIndex: 1 }}>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                  <div className="image-upload-wrapper">
                    <label className="image-upload-label">
                      <div className="avatar large" style={{ cursor: 'pointer', border: '2px dashed var(--text-4)' }}>
                        {editData.avatar_url ? <img src={editData.avatar_url} alt="Avatar" /> : '+'}
                      </div>
                      <span className="upload-text">Change Avatar</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFileChange(e, 'avatar')} />
                    </label>
                  </div>
                  
                  <div className="image-upload-wrapper">
                    <label className="image-upload-label">
                      <div className="cover-preview" style={{ cursor: 'pointer', border: '2px dashed var(--text-4)' }}>
                        {editData.cover_url ? 'Cover Set' : '+'}
                      </div>
                      <span className="upload-text">Change Cover</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFileChange(e, 'cover')} />
                    </label>
                  </div>
                </div>

                <div className="input-group-v">
                  <label>Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="auth-input" style={{ minHeight: '80px' }} />
                </div>
                <div className="input-group-v">
                  <label>Website</label>
                  <input value={editData.website} onChange={e => setEditData({...editData, website: e.target.value})} className="auth-input" placeholder="example.com" />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="profile-header">
              {profile.cover_url && <img src={profile.cover_url} className="cover-image-bg" alt="Cover" />}
              <div className="profile-top">
                <div className="avatar large">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} /> : profile.username.slice(0, 2)}
                </div>
                <div className="profile-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 className="profile-name">@{profile.username}</h1>
                    {profile.is_verified ? (
                      <span className="verify-badge verified" title="Connected via Google">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        Verified
                      </span>
                    ) : (
                      <span className="verify-badge unverified">Unverified</span>
                    )}
                  </div>
                  <p className="profile-bio">{profile.bio || 'No bio yet.'}</p>
                  <div className="profile-stats">
                    <span className="stat-item"><b>{profile.karma}</b> karma</span>
                    <span className="stat-item"><b>{profile.link_count}</b> posts</span>
                    <span className="stat-item clickable" onClick={() => openPopup('followers')}><b>{profile.follower_count}</b> followers</span>
                    <span className="stat-item clickable" onClick={() => openPopup('following')}><b>{profile.following_count}</b> following</span>
                  </div>
                </div>
                <div className="profile-actions">
                  {currentUser?.username === profile.username ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Profile</button>
                      <button onClick={() => { logout(); window.location.href = '/'; }} className="logout-btn">Logout</button>
                    </div>
                  ) : (
                    <button onClick={handleFollow} className={`follow-btn ${profile.isFollowing ? 'active' : ''}`}>
                      {profile.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="profile-feed">
            <h2 className="section-title">Submissions</h2>
            <div className="links-grid">
              {links.length === 0 ? (
                <div className="empty">No posts yet.</div>
              ) : (
                links.map((link: any) => (
                  <Link href={`/link/${link.id}`} key={link.id} className="link-card">
                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-domain">{new URL(link.original_url).hostname}</span>
                        <span className="card-time">{new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="card-title">{link.title}</div>
                      <div className="card-footer">
                        <span className="card-stat">▲ {link.upvote_count}</span>
                        <span className="card-stat">● {link.comment_count}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {showPopup && (
          <div className="popup-overlay" onClick={() => setShowPopup(null)}>
            <div className="popup-content" onClick={e => e.stopPropagation()}>
              <div className="popup-header">
                <h3>{showPopup === 'followers' ? 'Followers' : 'Following'}</h3>
                <button className="close-popup" onClick={() => setShowPopup(null)}>×</button>
              </div>
              <div className="popup-body">
                {popupLoading ? (
                  <div className="skel" style={{ height: '100px', width: '100%' }}></div>
                ) : popupUsers.length === 0 ? (
                  <div className="empty">No users found.</div>
                ) : (
                  popupUsers.map((u: any) => (
                    <Link href={`/profile/${u.username}`} key={u.id} className="user-row" onClick={() => setShowPopup(null)}>
                      <div className="avatar mini">
                        {u.avatar_url ? <img src={u.avatar_url} alt={u.username} /> : u.username.slice(0, 2)}
                      </div>
                      <div className="user-details">
                        <span className="u-name">@{u.username}</span>
                        <span className="u-karma">{u.karma} karma</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {cropState.imageSrc && (
          <div className="popup-overlay" style={{ zIndex: 2000 }}>
            <div className="popup-content" style={{ width: '90%', maxWidth: '500px', height: '600px', display: 'flex', flexDirection: 'column' }}>
              <div className="popup-header">
                <h3>Crop {cropState.type === 'avatar' ? 'Avatar' : 'Cover'}</h3>
                <button className="close-popup" onClick={() => setCropState({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null })}>×</button>
              </div>
              <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                <Cropper
                  image={cropState.imageSrc}
                  crop={cropState.crop}
                  zoom={cropState.zoom}
                  aspect={cropState.type === 'avatar' ? 1 : 3}
                  onCropChange={(crop) => setCropState(s => ({ ...s, crop }))}
                  onZoomChange={(zoom) => setCropState(s => ({ ...s, zoom }))}
                  onCropComplete={handleCropComplete}
                />
              </div>
              <div style={{ padding: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
                <button className="cancel-btn" onClick={() => setCropState({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null })}>Cancel</button>
                <button className="save-btn" onClick={handleUploadCroppedImage} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Save & Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .profile-header { 
            padding: 40px; 
            background: color-mix(in srgb, var(--bg-1) 50%, transparent); 
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border); 
            border-radius: 16px;
            margin: 20px;
            position: relative;
            overflow: hidden;
          }
          .profile-header.editing { padding: 30px; }
          .cover-image-bg {
            position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
            opacity: 0.15; z-index: 0; pointer-events: none;
          }
          .profile-top { display: flex; gap: 32px; align-items: flex-start; position: relative; z-index: 1; }
          .avatar.large { width: 100px; height: 100px; border-radius: 50%; font-size: 32px; background: var(--bg-3); display: flex; align-items: center; justify-content: center; border: 2px solid var(--border); overflow: hidden; }
          
          .image-upload-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
          .image-upload-label { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: opacity 0.2s; }
          .image-upload-label:hover { opacity: 0.8; }
          .cover-preview { width: 240px; height: 80px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-3); color: var(--text-4); font-size: 12px; }
          .upload-text { font-size: 11px; color: var(--text-3); font-weight: 500; text-transform: uppercase; }

          .profile-info { flex: 1; }
          .profile-name { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
          .profile-bio { font-size: 14px; color: var(--text-3); margin-bottom: 16px; line-height: 1.6; max-width: 600px; }
          .profile-stats { display: flex; gap: 24px; }
          .stat-item { font-size: 13px; color: var(--text-4); }
          .stat-item b { color: var(--text-2); font-weight: 600; }
          .stat-item.clickable { cursor: pointer; }
          .stat-item.clickable:hover b { color: var(--text); text-decoration: underline; }
          .verify-badge { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; }
          .verify-badge.verified { background: rgba(52, 211, 153, 0.1); color: #10b981; }
          .verify-badge.unverified { background: rgba(255, 255, 255, 0.05); color: var(--text-4); }
          
          .profile-feed { padding: 40px; }
          .links-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
          
          .edit-btn, .follow-btn, .save-btn, .cancel-btn, .logout-btn {
            padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; 
            transition: all 0.2s; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); cursor: pointer;
          }
          .logout-btn:hover { background: #ef4444; color: white; border-color: #ef4444; }
          .save-btn { background: var(--text); color: var(--bg); border-color: var(--text); }
          .follow-btn.active { background: var(--text); color: var(--bg); border-color: var(--text); }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); margin-bottom: 20px; }
          .edit-form { display: flex; flex-direction: column; gap: 16px; max-width: 500px; }
          .input-group-v { display: flex; flex-direction: column; gap: 8px; }
          .input-group-v label { font-size: 11px; color: var(--text-4); text-transform: uppercase; }
          .auth-input { padding: 10px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 13px; outline: none; }

          /* Popup Styles */
          .popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease-out; }
          .popup-content { width: 100%; max-width: 400px; background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; animation: slideUp 0.3s ease-out; }
          .popup-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
          .popup-header h3 { font-size: 14px; font-weight: 600; color: var(--text); }
          .close-popup { font-size: 24px; color: var(--text-4); cursor: pointer; line-height: 1; }
          .popup-body { max-height: 400px; overflow-y: auto; padding: 10px; }
          .user-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; transition: background 0.2s; }
          .user-row:hover { background: var(--bg-2); }
          .u-name { display: block; font-size: 13px; font-weight: 500; color: var(--text-2); }
          .u-karma { font-size: 11px; color: var(--text-4); }
          
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
      </main>
    </div>
  );
}
