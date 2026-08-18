import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine,
  RiCalendarEventLine,
  RiMoneyDollarCircleLine,
  RiSettings3Line,
  RiUserHeartLine,
  RiTimeLine,
  RiCloseLine,
  RiStoreLine,
  RiChatSmile2Line,
  RiVipCrownLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

const NAV_ITEMS = [
  { path: '/', Icon: RiDashboardLine, label: 'Dashboard' },
  { path: '/sessions', Icon: MdFitnessCenter, label: 'My Sessions' },
  { path: '/subscriptions', Icon: RiVipCrownLine, label: 'Subscriptions' },
  { path: '/availability', Icon: RiTimeLine, label: 'Availability' },
  { path: '/gyms', Icon: RiStoreLine, label: 'My Gyms' },
  { path: '/bookings', Icon: RiCalendarEventLine, label: 'Bookings' },
  { path: '/chat', Icon: RiChatSmile2Line, label: 'Messages', showBadge: true },
  { path: '/earnings', Icon: RiMoneyDollarCircleLine, label: 'Earnings' },
  { path: '/profile', Icon: RiUserHeartLine, label: 'My Profile' },
  { path: '/settings', Icon: RiSettings3Line, label: 'Settings' },
];

export default function Sidebar({ trainer, isOpen, isMobile, onClose, unreadMessages = 0 }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        backgroundColor: '#1B2F6B',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
        boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <img
            src="/logo.png"
            alt="Sankofa Fit"
            style={{
              height: 48,
              width: 'auto',
              maxWidth: 160,
              objectFit: 'contain',
              display: 'block',
              marginBottom: 4,
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: '#8B5CF6',
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            TRAINER PORTAL
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7B99',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <RiCloseLine size={20} />
          </button>
        )}
      </div>

      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {trainer?.profile_image_url ? (
              <img
                src={trainer.profile_image_url}
                alt={trainer.name || 'Trainer'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <RiUserHeartLine size={22} color="#8B5CF6" />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {trainer?.name || 'Your Name'}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: trainer?.is_approved ? '#30D158' : '#F5C842',
              }}
            >
              {trainer?.is_approved ? '● Active on App' : '● Pending Review'}
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={() => isMobile && onClose()}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              color: isActive ? '#F5C842' : '#6B7B99',
              backgroundColor: isActive ? 'rgba(245,200,66,0.08)' : 'transparent',
              borderRight: isActive ? '3px solid #F5C842' : '3px solid transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 700 : 400,
              transition: 'all 0.15s',
              position: 'relative',
            })}
          >
            <div style={{ position: 'relative' }}>
              <item.Icon size={20} />
              {item.showBadge && unreadMessages > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    minWidth: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    border: '2px solid #0D1B45',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <span
                    style={{
                      color: 'white',
                      fontSize: 9,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                </div>
              ) : null}
            </div>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.showBadge && unreadMessages > 0 ? (
              <div
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                }}
              >
                <span
                  style={{
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              </div>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
        }}
      >
        Sankofa Fit Trainer Portal v1.0
      </div>
    </div>
  );
}
