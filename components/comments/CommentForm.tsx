'use client';

import React from 'react';

interface CommentFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  submitLabel?: string;
  loading?: boolean;
}

export default function CommentForm({
  value,
  onChange,
  onSubmit,
  placeholder = 'What are your thoughts?',
  submitLabel = 'Post Comment',
  loading = false,
}: CommentFormProps) {
  return (
    <form onSubmit={onSubmit} className="comment-form">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="comment-input"
        disabled={loading}
      />
      <button type="submit" className="comment-btn" disabled={loading || !value.trim()}>
        {loading ? (
          <span className="comment-btn-loading">
            <span className="comment-spinner" />
            Posting...
          </span>
        ) : submitLabel}
      </button>
    </form>
  );
}
