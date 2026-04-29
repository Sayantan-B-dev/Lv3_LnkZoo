'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user);
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-mark">gx</div>
          <h1>Create an account</h1>
          <p>Join the community and start sharing</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group-v">
            <label>Username</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="auth-input"
              placeholder="johndoe"
            />
          </div>
          <div className="input-group-v">
            <label>Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="auth-input"
              placeholder="john@example.com"
            />
          </div>
          <div className="input-group-v">
            <label>Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="auth-input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
        .auth-card { width: 100%; max-width: 400px; background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 40px; }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-header .logo-mark { margin: 0 auto 16px; width: 40px; height: 40px; font-size: 18px; }
        .auth-header h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: var(--text); }
        .auth-header p { font-size: 14px; color: var(--text-4); }
        .auth-error { padding: 10px; background: rgba(255,0,0,0.1); color: #ff5555; border-radius: 6px; font-size: 12px; margin-bottom: 20px; border: 1px solid rgba(255,0,0,0.2); }
        .input-group-v { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .input-group-v label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-4); }
        .auth-input { padding: 12px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; outline: none; }
        .auth-input:focus { border-color: var(--text-4); }
        .auth-btn { width: 100%; padding: 12px; background: var(--text); color: var(--bg); border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px; transition: opacity 0.2s; }
        .auth-btn:hover { opacity: 0.9; }
        .auth-footer { margin-top: 32px; text-align: center; font-size: 13px; color: var(--text-4); }
        .auth-footer a { color: var(--text-2); font-weight: 500; }
      `}</style>
    </div>
  );
}
