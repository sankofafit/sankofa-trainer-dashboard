import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { logActivity, LOG_ACTIONS } from './utils/activityLogger';
import {
  registerSW,
  requestNotificationPermission,
  setupInstallPrompt,
  showNotification,
  isPWA,
  installPWA,
} from './utils/pwa';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import BookingsPage from './pages/BookingsPage';
import GymsPage from './pages/GymsPage';
import ChatPage from './pages/ChatPage';
import EarningsPage from './pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import useUnreadMessages from './hooks/useUnreadMessages';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { unreadCount } = useUnreadMessages(trainer);

  const loadTrainer = useCallback(async (userId, { logLogin = false } = {}) => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('owner_id', userId)
        .single();

      console.log('Trainer for user:', data?.name);
      console.log('Is approved:', data?.is_approved);
      console.log('Trainer error:', error);

      if (error || !data) {
        console.log('No trainer found for this user');
        setTrainer(null);
        return null;
      }

      setTrainer(data);

      if (logLogin) {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();

        await logActivity({
          actorId: userId,
          actorEmail: authSession?.user?.email,
          actorName: data.name,
          actorType: 'trainer',
          action: LOG_ACTIONS.AUTH_LOGIN,
          category: 'auth',
          description: 'Trainer logged in to dashboard',
          metadata: {
            trainer_id: data.id,
            trainer_name: data.name,
          },
          status: 'success',
        });
      }

      return data;
    } catch (e) {
      console.log('loadTrainer error:', e);
      setTrainer(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    registerSW();

    setupInstallPrompt(() => {
      if (!isPWA()) {
        setShowInstallBanner(true);
      }
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user?.id) {
        loadTrainer(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        setLoading(true);
        await loadTrainer(nextSession.user.id, {
          logLogin: _event === 'SIGNED_IN',
        });
      } else {
        setTrainer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadTrainer]);

  useEffect(() => {
    if (trainer) {
      requestNotificationPermission().then((granted) => {
        console.log('Notification permission:', granted);
      });
    }
  }, [trainer]);

  useEffect(() => {
    if (!trainer?.id || !trainer?.owner_id) return;

    const bookingSub = supabase
      .channel(`notify_bookings_${trainer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trainer_bookings',
          filter: `trainer_id=eq.${trainer.id}`,
        },
        async (payload) => {
          console.log('New booking!', payload);
          const booking = payload.new;

          await showNotification('🎉 New Booking!', {
            body: `New session booked: ${booking.session_type || 'Session'} on ${booking.session_date}`,
            icon: '/favicon.png',
            data: { url: '/bookings' },
            tag: 'new-booking',
            actions: [
              {
                action: 'view',
                title: 'View Booking',
              },
            ],
          });
        },
      )
      .subscribe();

    const messageSub = supabase
      .channel(`notify_messages_${trainer.owner_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${trainer.owner_id}`,
        },
        async (payload) => {
          console.log('New message!', payload);
          const msg = payload.new;

          await showNotification('💬 New Message!', {
            body:
              msg.content?.length > 50
                ? `${msg.content.slice(0, 50)}...`
                : msg.content,
            icon: '/favicon.png',
            data: { url: '/chat' },
            tag: 'new-message',
            actions: [
              {
                action: 'reply',
                title: 'Reply',
              },
            ],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSub);
      supabase.removeChannel(messageSub);
    };
  }, [trainer?.id, trainer?.owner_id]);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-main)',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#F5C842',
            letterSpacing: 3,
          }}
        >
          SANKOFA FIT
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Trainer Dashboard</div>
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(245,200,66,0.2)',
            borderTop: '3px solid #F5C842',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Layout
        trainer={trainer}
        session={session}
        loadTrainer={() => loadTrainer(session.user.id)}
        unreadMessages={unreadCount}
      >
        <Routes>
          <Route path="/" element={<DashboardPage trainer={trainer} />} />
          <Route path="/sessions" element={<SessionsPage trainer={trainer} />} />
          <Route path="/subscriptions" element={<SubscriptionsPage trainer={trainer} />} />
          <Route path="/availability" element={<AvailabilityPage trainer={trainer} />} />
          <Route path="/bookings" element={<BookingsPage trainer={trainer} />} />
          <Route path="/gyms" element={<GymsPage trainer={trainer} />} />
          <Route path="/chat" element={<ChatPage trainer={trainer} />} />
          <Route path="/earnings" element={<EarningsPage trainer={trainer} />} />
          <Route
            path="/profile"
            element={
              <ProfilePage trainer={trainer} setTrainer={setTrainer} userId={session.user.id} />
            }
          />
          <Route path="/settings" element={<SettingsPage session={session} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {showInstallBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1B2F6B',
            border: '1px solid rgba(245,200,66,0.4)',
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxWidth: 420,
            width: 'calc(100% - 40px)',
          }}
        >
          <img
            src="/favicon.png"
            alt="Sankofa Fit"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: 'white',
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 2,
              }}
            >
              Install Sankofa Trainer
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
              }}
            >
              Add to home screen for quick access and notifications
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={async () => {
                const installed = await installPWA();
                if (installed) {
                  setShowInstallBanner(false);
                }
              }}
              style={{
                backgroundColor: '#F5C842',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                color: '#1B2F6B',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Install App
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 11,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </Router>
  );
}
