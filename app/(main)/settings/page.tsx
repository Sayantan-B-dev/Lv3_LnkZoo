'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ConfirmModal from '@/components/common/ConfirmModal';
import PasswordInput from '@/components/common/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

const DELETE_PHRASE = 'DELETE MY ACCOUNT';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
  if (score <= 4) return { score, label: 'Good', color: '#22c55e' };
  return { score, label: 'Strong', color: '#16a34a' };
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (!user) router.push('/login?from=/settings');
  }, [user, router]);

  if (!user) return null;

  const pwStrength = passwordStrength(newPassword);
  const pwErrors: string[] = [];
  if (newPassword && newPassword.length < 8) pwErrors.push('At least 8 characters');
  if (newPassword && !/[a-z]/.test(newPassword)) pwErrors.push('One lowercase letter');
  if (newPassword && !/[A-Z]/.test(newPassword)) pwErrors.push('One uppercase letter');
  if (newPassword && !/[0-9]/.test(newPassword)) pwErrors.push('One number');
  if (newPassword && !/[^a-zA-Z0-9]/.test(newPassword)) pwErrors.push('One special character');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (pwErrors.length > 0) { addToast('Fix password requirements', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        addToast('Password updated', 'success');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed', 'error');
      }
    } catch {
      addToast('Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteConfirmText, password: deletePassword }),
      });
      if (res.ok) {
        addToast('Account deleted', 'success');
        await logout();
        router.push('/');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed', 'error');
      }
    } catch {
      addToast('Failed to delete account', 'error');
    }
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Topbar title="Settings" />
      <NotificationPanel />

      <div id="content">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>Settings</h2>

          {/* Account Info */}
          <div className="submit-card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Account</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>
              Logged in as <strong>{user.username}</strong>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              Email: {user.email}
            </p>
          </div>

          {/* Change Password */}
          <div className="submit-card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="input-group-v">
                <label>Current Password</label>
                <PasswordInput value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="sub-input" />
              </div>
              <div className="input-group-v">
                <label>New Password</label>
                <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} className="sub-input" placeholder="Min 8 characters" />
              </div>
              {newPassword && (
                <>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-3)', marginBottom: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${(pwStrength.score / 5) * 100}%`, height: '100%', background: pwStrength.color, transition: 'width 0.2s' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: pwStrength.color, marginBottom: '8px', fontWeight: 500 }}>{pwStrength.label}</div>
                  <ul style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 12px 0', paddingLeft: '16px', listStyle: 'disc' }}>
                    {pwErrors.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </>
              )}
              <button type="submit" className="final-btn" disabled={loading || !currentPassword || !newPassword || pwErrors.length > 0}>
                Update Password
              </button>
            </form>
          </div>

          {/* Delete Account */}
          <div className="submit-card" style={{ borderColor: 'color-mix(in srgb, #ef4444 30%, var(--border))' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>Danger Zone</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '12px' }}>
              Once you delete your account, there is no going back. All your links, comments, and data will be permanently removed.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: '1px solid #ef4444',
                background: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="ml-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="ml-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ml-modal-title">Delete Account</div>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>
              This action is permanent. Type <strong style={{ color: '#ef4444' }}>{DELETE_PHRASE}</strong> below and enter your password to confirm.
            </p>
            <input
              type="text"
              className="ml-modal-input"
              placeholder={`Type ${DELETE_PHRASE}`}
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              autoFocus
              style={{ marginBottom: '8px' }}
            />
            <PasswordInput
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="ml-modal-input"
              placeholder="Your password"
            />
            <div className="ml-modal-actions">
              <button className="ml-bulk-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button
                className="ml-bulk-btn ml-bulk-btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== DELETE_PHRASE || !deletePassword}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
