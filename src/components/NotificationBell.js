import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import { RiBellLine, RiBellFill, RiCheckDoubleLine } from 'react-icons/ri';

export default function NotificationBell({ trainer }) {
  const [open, setOpen] = useState(false);
  const [isWide, setIsWide] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 480,
  );
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAllRead, markOneRead } =
    useNotifications(trainer);

  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth > 480);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = async (notif) => {
    await markOneRead(notif.id);
    setOpen(false);
    if (notif.url) {
      navigate(notif.url);
    }
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!trainer?.id) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Notifications"
        style={{
          position: 'relative',
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: open
            ? 'rgba(139,92,246,0.15)'
            : 'rgba(255,255,255,0.06)',
          border: `1px solid ${
            open ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'
          }`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        {unreadCount > 0 ? (
          <RiBellFill size={20} color="#F5C842" />
        ) : (
          <RiBellLine size={20} color="#6B7B99" />
        )}

        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: '#EF4444',
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #080C1C',
              zIndex: 1,
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 10,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            right: isWide ? 16 : 8,
            left: isWide ? 'auto' : 8,
            width: isWide ? 360 : 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 80px)',
            backgroundColor: '#0D1B45',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    color: '#EF4444',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  color: '#8B5CF6',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                <RiCheckDoubleLine size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#6B7B99',
                  fontSize: 14,
                }}
              >
                <RiBellLine
                  size={36}
                  color="rgba(107,123,153,0.3)"
                  style={{ marginBottom: 12 }}
                />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    backgroundColor: notif.is_read
                      ? 'transparent'
                      : 'rgba(139,92,246,0.08)',
                    transition: 'background 0.15s',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.is_read
                      ? 'transparent'
                      : 'rgba(139,92,246,0.08)';
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: notif.is_read ? 'transparent' : '#8B5CF6',
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        color: 'white',
                        fontSize: 13,
                        fontWeight: notif.is_read ? 500 : 700,
                        marginBottom: 3,
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      style={{
                        color: '#9AA5B9',
                        fontSize: 12,
                        lineHeight: 1.5,
                        marginBottom: 4,
                        wordBreak: 'break-word',
                      }}
                    >
                      {notif.body}
                    </div>
                    <div
                      style={{
                        color: '#6B7B99',
                        fontSize: 11,
                      }}
                    >
                      {timeAgo(notif.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
