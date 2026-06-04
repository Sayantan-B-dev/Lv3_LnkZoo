'use client';

import React, { useState } from 'react';

interface CommentFormProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit: (e: React.FormEvent, content: string) => void;
  placeholder?: string;
  submitLabel?: string;
  loading?: boolean;
  controlled?: boolean;
}

export default function CommentForm({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'What are your thoughts?',
  submitLabel = 'Post Comment',
  loading = false,
  controlled = true,
}: CommentFormProps) {
  const [localValue, setLocalValue] = useState('');

  const currentValue = controlled ? value : localValue;
  const handleChange = controlled
    ? (onChange || (() => {}))
    : (v: string) => setLocalValue(v);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!currentValue.trim() || loading) return;
      onSubmit(e, currentValue);
      if (!controlled) setLocalValue('');
    }} className="comment-form">
      <textarea
        placeholder={placeholder}
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className="comment-input"
        disabled={loading}
      />
      <button type="submit" className="comment-btn" disabled={loading || !currentValue.trim()}>
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
