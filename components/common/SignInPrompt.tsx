'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function SignInPrompt() {
  const { user, loading } = useAuth();

  if (loading || user) return null;

  return (
    <Link href="/login" className="signin-prompt" title="Sign in">
      <div className="signin-prompt-ring" />
      <div className="signin-prompt-content">
        <svg className="signin-prompt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        <p className="signin-prompt-text">Sign in</p>
      </div>
    </Link>
  );
}
