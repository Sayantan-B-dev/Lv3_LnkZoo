'use client';

import React from 'react';

interface CommentItemProps {
  comment: {
    id: string;
    username: string;
    content: string;
    created_at: string;
  };
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export default function CommentItem({ comment, isOwner = false, onDelete }: CommentItemProps) {
  return (
    <div className="comment-item">
      <div className="comment-meta">
        <span className="comment-author">@{comment.username}</span>
        <span className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</span>
        {isOwner && onDelete && (
          <button onClick={() => onDelete(comment.id)} className="comment-del-btn">delete</button>
        )}
      </div>
      <div className="comment-content">{comment.content}</div>
      <div className="comment-actions">
        <span className="comment-stat">Reply</span>
      </div>
    </div>
  );
}
