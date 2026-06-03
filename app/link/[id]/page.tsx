'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useAuth } from '@/context/AuthContext';

export default function LinkDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const [link, setLink] = useState<any>(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const openConfirm = (message: string, onConfirm: () => void) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const [isEditingLink, setIsEditingLink] = useState(false);
  const [editLinkData, setEditLinkData] = useState({ title: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linkRes, commRes] = await Promise.all([
        fetch(`/api/links/${id}`),
        fetch(`/api/comments?link_id=${id}`)
      ]);
      if (linkRes.ok && commRes.ok) {
        const linkData = await linkRes.json();
        const commData = await commRes.json();
        setLink(linkData?.link);
        setComments(commData.comments);
        setEditLinkData({
          title: linkData.link.title,
          description: linkData.link.description || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch link details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', ...editLinkData }),
      });
      if (res.ok) {
        setLink({ ...link, ...editLinkData });
        setIsEditingLink(false);
      }
    } catch (err) {
      console.error('Link update failed', err);
    }
  };

  const handleCommentDelete = (commentId: string) => {
    openConfirm('Delete this comment?', async () => {
      closeConfirm();
      try {
        const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
        if (res.ok) setComments(comments.filter((c: any) => c.id !== commentId));
      } catch (err) {
        console.error('Comment delete failed', err);
      }
    });
  };

  const handleLike = async () => {
    if (!user) {
      window.location.href = `/login?from=/link/${id}`;
      return;
    }
    try {
      const res = await fetch(`/api/links/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLink((prev: any) => ({ ...prev, liked_by_user: data.liked, like_count: data.like_count }));
      }
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, content: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  if (loading) return null;
  if (!link) {
    return (
      <div id="app">
        <Sidebar />
        <main id="main">
          <Topbar title="Not Found" />
          <div id="content">Link not found.</div>
        </main>
      </div>
    );
  }

  return (
    <div id="app">
      <CustomCursor />
      <Sidebar />
      <main id="main">
        <Topbar title="Discussion" />
        <NotificationPanel />
        
        <div id="content">
          <div className="link-card detail">
              <div className="card-body">
                <div className="card-meta">
                  <span className="card-domain">{new URL(link.original_url).hostname}</span>
                  <span className="card-poster">@{link.username}</span>
                  <span className="card-time">{new Date(link.created_at).toLocaleDateString()}</span>
                </div>
                
                {isEditingLink ? (
                  <form onSubmit={handleUpdateLink} className="edit-link-form">
                    <input value={editLinkData.title} onChange={e => setEditLinkData({...editLinkData, title: e.target.value})} className="auth-input" style={{ width: '100%', marginBottom: '10px' }} />
                    <textarea value={editLinkData.description} onChange={e => setEditLinkData({...editLinkData, description: e.target.value})} className="auth-input" style={{ width: '100%', minHeight: '80px', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" className="save-btn">Save</button>
                      <button type="button" onClick={() => setIsEditingLink(false)} className="cancel-btn">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className="card-title" style={{ fontSize: '20px' }}>{link.title}</h1>
                    <p className="card-desc" style={{ WebkitLineClamp: 'unset' }}>{link.description}</p>
                  </>
                )}

                <div className="card-tags">
                  {link.tags?.map((t: string) => <Link href={`/tags/${t}`} key={t} className="tag">#{t}</Link>)}
                </div>
                <div className="card-footer" style={{ marginTop: '20px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a href={link.original_url} target="_blank" rel="noopener" className="visit-btn">Open Link ↗</a>
                    <button onClick={handleLike} className={`like-btn ${link.liked_by_user ? 'active' : ''}`}>
                      <svg width="14" height="14" fill={link.liked_by_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.35-1.92-4.25-4.29-4.25-1.69 0-3.15.97-3.85 2.38A4.32 4.32 0 008.86 4C6.48 4 4.5 5.9 4.5 8.25c0 6.03 7.5 10.75 7.5 10.75s9-4.72 9-10.75z" />
                      </svg>
                      {link.like_count ?? 0}
                    </button>
                    {user?.username === link.username && !isEditingLink && (
                      <button onClick={() => setIsEditingLink(true)} className="edit-link-btn">Edit</button>
                    )}
                  </div>
                  {user?.username === link.username && (
                    <button onClick={() => {
                      openConfirm('Delete this link? This cannot be undone.', async () => {
                        closeConfirm();
                        await fetch(`/api/links/${id}`, { method: 'DELETE' });
                        window.location.href = '/';
                      });
                    }} className="delete-btn">Delete Link</button>
                  )}
                </div>
              </div>
          </div>

          <div className="comments-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Discussion ({comments.length})</h2>
            
            {user ? (
              <form onSubmit={handlePostComment} className="comment-form">
                <textarea 
                  placeholder="What are your thoughts?" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="comment-input"
                />
                <button type="submit" className="comment-btn">Post Comment</button>
              </form>
            ) : (
              <div className="auth-prompt">Sign in to join the discussion.</div>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="empty">No comments yet. Be the first!</div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-meta">
                      <span className="comment-author">@{c.username}</span>
                      <span className="comment-time">{new Date(c.created_at).toLocaleDateString()}</span>
                      {user?.username === c.username && (
                        <button onClick={() => handleCommentDelete(c.id)} className="comment-del-btn">delete</button>
                      )}
                    </div>
                    <div className="comment-content">{c.content}</div>
                    <div className="comment-actions">
                      <span className="comment-stat">Reply</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {confirm && (
          <ConfirmModal
            message={confirm.message}
            onConfirm={confirm.onConfirm}
            onCancel={closeConfirm}
            danger={true}
          />
        )}
      </main>
    </div>
  );
}
