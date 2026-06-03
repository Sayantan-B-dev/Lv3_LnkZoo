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


      </main>
    </div>
  );
}
