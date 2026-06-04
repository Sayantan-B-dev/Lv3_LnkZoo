'use client';

import React from 'react';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentThreadProps {
  comments: any[];
  currentUsername?: string | null;
  commentValue: string;
  onCommentChange: (value: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onCommentDelete: (id: string) => void;
  isAuthenticated: boolean;
  postingComment?: boolean;
}

export default function CommentThread({
  comments,
  currentUsername,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  onCommentDelete,
  isAuthenticated,
  postingComment = false,
}: CommentThreadProps) {
  return (
    <div className="comments-section">
      <h2 className="section-title">Discussion ({comments.length})</h2>

      {isAuthenticated ? (
        <CommentForm
          value={commentValue}
          onChange={onCommentChange}
          onSubmit={onCommentSubmit}
          loading={postingComment}
        />
      ) : (
        <div className="auth-prompt">Sign in to join the discussion.</div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="empty">No comments yet. Be the first!</div>
        ) : (
          comments.map((c: any) => (
            <CommentItem
              key={c.id}
              comment={c}
              isOwner={currentUsername === c.username}
              onDelete={onCommentDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
