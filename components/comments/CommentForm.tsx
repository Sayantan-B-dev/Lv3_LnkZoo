'use client';

import React from 'react';

interface CommentFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  submitLabel?: string;
}

export default function CommentForm({
  value,
  onChange,
  onSubmit,
  placeholder = 'What are your thoughts?',
  submitLabel = 'Post Comment',
}: CommentFormProps) {
  return (
    <form onSubmit={onSubmit} className="comment-form">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="comment-input"
      />
      <button type="submit" className="comment-btn">{submitLabel}</button>
    </form>
  );
}
