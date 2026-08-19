import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isPWA } from '../utils/pwa';
import {
  RiMenuLine,
  RiLogoutBoxLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiSunLine,
  RiMoonLine,
} from 'react-icons/ri';
import useTheme from '../hooks/useTheme';
import NotificationBell from './NotificationBell';

export default function Header({ trainer, session, onMenuToggle, isMobile }) {
  const { theme, toggleTheme } = useTheme();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const installPromptRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      installPromptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPromptRef.current) {
      installPromptRef.current.prompt();
      const result = await installPromptRef.current.userChoice;
      if (result.outcome === 'accepted') {
        setCanInstall(false);
        installPromptRef.current = null;
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Sign out of Trainer Dashboard?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <>
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

          {!isPWA() && (
            <button
              type="button"
              onClick={handleInstall}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#F5C842',
                border: 'none',
                borderRadius: 50,
                padding: '8px 16px',
                cursor: 'pointer',
                color: '#1B2F6B',
                fontSize: 13,
                fontWeight: 900,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(245,200,66,0.3)',
                animation: canInstall ? 'pulse 2s infinite' : undefined,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2F6B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v13M7 9l5 5 5-5" />
                <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
              </svg>
              {isMobile ? 'Install' : 'Install App'}
            </button>
          )}

          <NotificationBell trainer={trainer} />

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme === 'dark' ? 'rgba(245,200,66,0.12)' : '#1B2F6B',
              border: `1.5px solid ${theme === 'dark' ? 'rgba(245,200,66,0.4)' : '#1B2F6B'}`,
              borderRadius: 50,
              padding: '8px 16px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#F5C842' : 'white',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.3,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {theme === 'dark' ? (
              <>
                <RiSunLine size={16} />
                {!isMobile && 'Light Mode'}
              </>
            ) : (
              <>
                <RiMoonLine size={16} />
                {!isMobile && 'Dark Mode'}
              </>
            )}
          </button>

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

      {showInstallModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowInstallModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0D1B45',
              borderRadius: 20,
              padding: 28,
              maxWidth: 380,
              width: '100%',
              border: '1px solid rgba(245,200,66,0.3)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                Install Sankofa Trainer
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7B99',
                  fontSize: 22,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <img
              src="/logo.png"
              alt="Sankofa Fit"
              style={{
                height: 48,
                background: '#1B2F6B',
                padding: '8px 16px',
                borderRadius: 12,
                display: 'block',
                marginBottom: 20,
              }}
            />

            <div
              style={{
                backgroundColor: 'rgba(27,47,107,0.5)',
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  color: '#F5C842',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                iPhone / Safari
              </div>
              {[
                {
                  text: 'Tap the Share button',
                  sub: 'at the bottom of Safari',
                  icon: '⬆️',
                },
                {
                  text: 'Tap "Add to Home Screen"',
                  sub: 'scroll down if needed',
                  icon: '➕',
                },
                {
                  text: 'Tap "Add"',
                  sub: 'app appears on home screen',
                  icon: '✅',
                },
              ].map((item, i) => (
                <div
                  key={item.text}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: i < 2 ? 10 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: 'rgba(245,200,66,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {item.text}
                    </div>
                    <div
                      style={{
                        color: '#6B7B99',
                        fontSize: 11,
                        marginTop: 1,
                      }}
                    >
                      {item.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                backgroundColor: 'rgba(27,47,107,0.5)',
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  color: '#8B5CF6',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                Android / Chrome
              </div>
              {[
                {
                  text: 'Tap the 3-dot menu',
                  sub: 'top right of Chrome',
                  icon: '⋮',
                },
                {
                  text: 'Tap "Add to Home screen"',
                  sub: 'or "Install app"',
                  icon: '➕',
                },
                {
                  text: 'Tap "Add"',
                  sub: 'app appears on home screen',
                  icon: '✅',
                },
              ].map((item, i) => (
                <div
                  key={item.text}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: i < 2 ? 10 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: 'rgba(139,92,246,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {item.text}
                    </div>
                    <div
                      style={{
                        color: '#6B7B99',
                        fontSize: 11,
                        marginTop: 1,
                      }}
                    >
                      {item.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 14,
                color: '#6B7B99',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
