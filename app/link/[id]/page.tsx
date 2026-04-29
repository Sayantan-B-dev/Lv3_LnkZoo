'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import CustomCursor from '@/components/common/CustomCursor';
import AnimatedBg from '@/components/common/AnimatedBg';
import { useAuth } from '@/context/AuthContext';

export default function LinkDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const [link, setLink] = useState<any>(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linkRes, commRes] = await Promise.all([
        fetch(`/api/links/${id}`),
        fetch(`/api/comments?link_id=${id}`)
      ]);
      if (linkRes.ok && commRes.ok) {
        const linkData = await linkRes.ok ? await linkRes.json() : null;
        const commData = await commRes.json();
        setLink(linkData?.link);
        setComments(commData.comments);
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

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ linkId: id, content: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchData(); // Refresh comments
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  if (loading) return null;
  if (!link) return <div id="app"><Sidebar /><main id="main"><Topbar title="Not Found" /><div id="content">Link not found.</div></main></div>;

  return (
    <div id="app">
      <CustomCursor />
      <AnimatedBg />
      <Sidebar />
      <main id="main">
        <Topbar title="Discussion" />
        <NotificationPanel />
        
        <div id="content">
          <div className="link-card detail">
             <div className="vote-col">
                <button className="vote-btn up">▲</button>
                <span className="vote-count">{link.upvote_count - link.downvote_count}</span>
                <button className="vote-btn down">▼</button>
              </div>
              <div className="card-body">
                <div className="card-meta">
                  <span className="card-domain">{new URL(link.original_url).hostname}</span>
                  <span className="card-poster">@{link.username}</span>
                  <span className="card-time">{new Date(link.created_at).toLocaleDateString()}</span>
                </div>
                <h1 className="card-title" style={{ fontSize: '20px' }}>{link.title}</h1>
                <p className="card-desc" style={{ webkitLineClamp: 'unset' }}>{link.description}</p>
                <div className="card-tags">
                  {link.tags?.map((t: string) => <span key={t} className="tag">#{t}</span>)}
                </div>
                <div className="card-footer" style={{ marginTop: '20px' }}>
                  <a href={link.original_url} target="_blank" rel="noopener" className="visit-btn">Open Link ↗</a>
                </div>
              </div>
          </div>

          <div className="comments-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Discussion ({link.comment_count})</h2>
            
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
                    </div>
                    <div className="comment-content">{c.content}</div>
                    <div className="comment-actions">
                      <span className="comment-stat">▲ {c.upvote_count}</span>
                      <span className="comment-stat">Reply</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .link-card.detail { padding: 32px; margin-bottom: 0; }
          .visit-btn { padding: 10px 24px; background: var(--text); color: var(--bg); border-radius: 8px; font-weight: 500; font-size: 13px; }
          .comment-form { margin-bottom: 32px; }
          .comment-input { width: 100%; min-height: 100px; padding: 16px; background: var(--bg-1); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; margin-bottom: 12px; outline: none; resize: vertical; }
          .comment-input:focus { border-color: var(--text-4); }
          .comment-btn { padding: 8px 20px; background: var(--text); color: var(--bg); border-radius: 6px; font-size: 12px; font-weight: 500; }
          .comments-list { display: flex; flex-direction: column; gap: 24px; }
          .comment-item { padding-left: 16px; border-left: 2px solid var(--border); }
          .comment-meta { display: flex; gap: 10px; margin-bottom: 8px; font-size: 11px; }
          .comment-author { color: var(--text-2); font-weight: 600; }
          .comment-time { color: var(--text-4); }
          .comment-content { font-size: 14px; color: var(--text-2); line-height: 1.6; margin-bottom: 12px; }
          .comment-actions { display: flex; gap: 16px; font-size: 11px; color: var(--text-4); }
          .comment-stat { cursor: pointer; transition: color 0.2s; }
          .comment-stat:hover { color: var(--text-2); }
          .auth-prompt { padding: 20px; text-align: center; background: var(--bg-1); border: 1px dashed var(--border); border-radius: 8px; color: var(--text-4); font-size: 13px; margin-bottom: 32px; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4); margin-bottom: 24px; }
        `}</style>
      </main>
    </div>
  );
}
