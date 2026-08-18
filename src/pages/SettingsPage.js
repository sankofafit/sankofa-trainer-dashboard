import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SettingsPage({ session }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('✅ Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Sign out?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            color: 'var(--text-primary)',
            fontSize: 24,
            fontWeight: 900,
            margin: 0,
          }}
        >
          Settings
        </h1>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid var(--border)',
          marginBottom: 16,
          maxWidth: 500,
        }}
      >
        <div
          style={{
            color: '#F5C842',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Account
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Email: </strong>
          {session?.user?.email}
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid var(--border)',
          marginBottom: 16,
          maxWidth: 500,
        }}
      >
        <div
          style={{
            color: '#F5C842',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Change Password
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: 12,
              color: '#EF4444',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              backgroundColor: 'rgba(48,209,88,0.08)',
              border: '1px solid rgba(48,209,88,0.3)',
              borderRadius: 10,
              padding: 12,
              color: '#30D158',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              style={inputStyle}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#8B5CF6',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: 10,
              padding: '11px 20px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid var(--border)',
          marginBottom: 16,
          maxWidth: 500,
        }}
      >
        <div
          style={{
            color: '#F5C842',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Support
        </div>
        <a
          href="mailto:support@sankofafit.com"
          style={{
            backgroundColor: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 10,
            padding: '10px 20px',
            color: '#F5C842',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          📧 support@sankofafit.com
        </a>
      </div>

      <button
        onClick={handleLogout}
        style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '14px 24px',
          color: '#EF4444',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          maxWidth: 500,
          width: '100%',
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  marginBottom: 8,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
