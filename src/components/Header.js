import React from 'react';
import { supabase } from '../lib/supabase';
import {
  RiMenuLine,
  RiLogoutBoxLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from 'react-icons/ri';

export default function Header({ trainer, session, onMenuToggle, isMobile }) {
  const handleLogout = async () => {
    if (window.confirm('Sign out of Trainer Dashboard?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0D1B45',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '0 12px' : '0 20px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <button
        type="button"
        onClick={onMenuToggle}
        style={{
          background: 'none',
          border: 'none',
          color: '#6B7B99',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <RiMenuLine size={22} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {trainer?.is_approved ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(48,209,88,0.1)',
              border: '1px solid rgba(48,209,88,0.2)',
              borderRadius: 8,
              padding: '5px 10px',
              color: '#30D158',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <RiCheckboxCircleLine size={13} />
            {!isMobile && 'Live on App'}
          </div>
        ) : trainer ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(245,200,66,0.1)',
              border: '1px solid rgba(245,200,66,0.3)',
              borderRadius: 8,
              padding: '5px 10px',
              color: '#F5C842',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <RiTimeLine size={13} />
            {!isMobile && 'Awaiting Approval'}
          </div>
        ) : null}

        {!isMobile && (
          <div style={{ color: '#6B7B99', fontSize: 12 }}>{session?.user?.email}</div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: isMobile ? '7px 10px' : '7px 14px',
            color: '#EF4444',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RiLogoutBoxLine size={16} />
          {!isMobile && 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
