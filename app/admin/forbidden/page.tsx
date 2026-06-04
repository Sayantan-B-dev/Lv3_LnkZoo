'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ForbiddenPage() {
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '40px',
      textAlign: 'center',
      background: 'var(--bg)',
      color: 'var(--text)',
    }}>
      <svg width="64" height="64" fill="none" stroke="var(--text-3)" strokeWidth="1" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
      </svg>
      <h1 style={{ fontSize: '28px', fontWeight: 600 }}>Access Denied</h1>
      <p style={{ color: 'var(--text-2)', maxWidth: '400px', lineHeight: 1.6 }}>
        {user
          ? 'Your account does not have administrator privileges. Please contact the site admin if you believe this is a mistake.'
          : 'You need to sign in with an administrator account to access this area.'}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href="/" style={{
          padding: '10px 24px',
          borderRadius: '8px',
          background: 'var(--accent)',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 500,
        }}>Go Home</Link>
        {!user && (
          <Link href="/login" style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontWeight: 500,
          }}>Sign In</Link>
        )}
      </div>
    </div>
  );
}
