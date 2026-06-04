'use client';

import React, { useState, useEffect, useRef } from 'react';
import CommentForm from './CommentForm';

interface CommentData {
  id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
  depth: number;
}

interface CommentItemProps {
  comment: CommentData;
  children: React.ReactNode;
  currentUsername?: string | null;
  onDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => Promise<boolean>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  postingReply: boolean;
  depth: number;
}

export default function CommentItem({
  comment,
  children,
  currentUsername,
  onDelete,
  onReply,
  replyingTo,
  setReplyingTo,
  postingReply,
  depth,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const replyRef = useRef<HTMLDivElement>(null);
  const hasChildren = React.Children.count(children) > 0;
  const isOwner = currentUsername === comment.username;

  useEffect(() => {
    if (replyingTo === comment.id && replyRef.current) {
      replyRef.current.querySelector('textarea')?.focus();
    }
  }, [replyingTo, comment.id]);

  if (comment.is_deleted) {
    return (
      <div className="comment-item deleted" style={{ marginLeft: depth > 0 ? `${Math.min(depth, 8) * 24}px` : '0' }}>
        <div className="comment-content deleted">[deleted]</div>
        {hasChildren && (
          <>
            <button className="toggle-replies-btn" onClick={() => setShowReplies(!showReplies)}>
              {showReplies ? 'Hide replies' : `Show ${React.Children.count(children)} replies`}
            </button>
            {showReplies && <div className="comment-replies">{children}</div>}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="comment-item" style={{ marginLeft: depth > 0 ? `${Math.min(depth, 8) * 24}px` : '0' }}>
      {depth > 0 && <div className="thread-line" />}

      <div className="comment-meta">
        <span className="comment-author">@{comment.username}</span>
        <span className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</span>
        {isOwner && (
          <button onClick={() => onDelete(comment.id)} className="comment-del-btn">delete</button>
        )}
      </div>

      <div className="comment-content">{comment.content}</div>

      <div className="comment-actions">
        {replyingTo === comment.id ? (
          <span className="comment-stat cancel-reply" onClick={() => setReplyingTo(null)}>Cancel</span>
        ) : (
          <span
            className={`comment-stat reply-btn ${!currentUsername ? 'disabled' : ''}`}
            onClick={() => {
              if (!currentUsername) return;
              setReplyingTo(comment.id);
            }}
          >
            Reply
          </span>
        )}
      </div>

      {replyingTo === comment.id && (
        <div ref={replyRef} className="inline-reply-form" style={{ marginTop: '8px' }}>
          <CommentForm
            value=""
            onChange={() => {}}
            onSubmit={(e, content) => {
              e.preventDefault();
              if (content.trim()) {
                onReply(comment.id, content);
              }
            }}
            placeholder={`Reply to @${comment.username}...`}
            submitLabel="Reply"
            loading={postingReply}
            controlled={false}
          />
        </div>
      )}

      {hasChildren && (
        <>
          <button className="toggle-replies-btn" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? 'Hide replies' : `${React.Children.count(children)} ${React.Children.count(children) === 1 ? 'reply' : 'replies'}`}
          </button>
          {showReplies && <div className="comment-replies">{children}</div>}
        </>
      )}
    </div>
  );
}
