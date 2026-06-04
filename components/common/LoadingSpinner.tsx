'use client';

import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ text, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner loading-${size}`}>
      <div className="spinner" />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
}
