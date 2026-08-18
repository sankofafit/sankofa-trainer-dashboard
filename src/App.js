import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { logActivity, LOG_ACTIONS } from './utils/activityLogger';
import {
  registerSW,
  requestNotificationPermission,
  showTrainerNotification,
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
    if (!trainer?.id || !trainer?.owner_id) return;

    requestNotificationPermission();

    const bookingSub = supabase
      .channel(`notif_booking_${trainer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trainer_bookings',
          filter: `trainer_id=eq.${trainer.id}`,
        },
        async (payload) => {
          const b = payload.new;
          console.log('🎉 New booking:', b);

          let clientName = 'A client';
          if (b.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', b.user_id)
              .single();
            clientName = user?.full_name || clientName;
          }

          await showTrainerNotification('new_booking', {
            clientName,
            sessionType: b.session_type,
            date: b.session_date,
            time: b.session_time,
          });
        },
      )
      .subscribe();

    const messageSub = supabase
      .channel(`notif_msg_${trainer.owner_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${trainer.owner_id}`,
        },
        async (payload) => {
          const msg = payload.new;
          console.log('💬 New message:', msg);

          let senderName = 'A client';
          if (msg.sender_id) {
            const { data: user } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', msg.sender_id)
              .single();
            senderName = user?.full_name || senderName;
          }

          await showTrainerNotification('new_message', {
            clientName: senderName,
            content: msg.content,
          });
        },
      )
      .subscribe();

    const profileSub = supabase
      .channel(`notif_profile_${trainer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trainers',
          filter: `id=eq.${trainer.id}`,
        },
        async (payload) => {
          const updated = payload.new;
          const old = payload.old;

          console.log('Trainer updated:', updated);

          if (!old.is_approved && updated.is_approved) {
            await showTrainerNotification('approved', {});
          }

          if (
            old.is_approved &&
            !updated.is_approved &&
            updated.rejection_reason
          ) {
            await showTrainerNotification('rejected', {
              reason: updated.rejection_reason,
            });
          }

          if (old.is_active && !updated.is_active) {
            await showTrainerNotification('suspended', {});
          }
        },
      )
      .subscribe();

    const reviewSub = supabase
      .channel(`notif_review_${trainer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trainer_reviews',
          filter: `trainer_id=eq.${trainer.id}`,
        },
        async (payload) => {
          const review = payload.new;
          console.log('⭐ New review:', review);

          await showTrainerNotification('new_review', {
            clientName: review.user_name,
            rating: review.rating,
            review: review.review?.slice(0, 50),
          });
        },
      )
      .subscribe();

    const cancelSub = supabase
      .channel(`notif_cancel_${trainer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trainer_bookings',
          filter: `trainer_id=eq.${trainer.id}`,
        },
        async (payload) => {
          const updated = payload.new;
          const old = payload.old;

          if (old.status !== 'cancelled' && updated.status === 'cancelled') {
            console.log('❌ Booking cancelled');

            let clientName = 'A client';
            if (updated.user_id) {
              const { data: user } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', updated.user_id)
                .single();
              clientName = user?.full_name || clientName;
            }

            await showTrainerNotification('booking_cancelled', {
              clientName,
              sessionType: updated.session_type,
              date: updated.session_date,
            });
          }
        },
      )
      .subscribe();

    const payoutSub = supabase
      .channel(`notif_payout_${trainer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payout_history',
          filter: `trainer_id=eq.${trainer.id}`,
        },
        async (payload) => {
          const payout = payload.new;
          console.log('💰 Payout sent:', payout);

          await showTrainerNotification('payout_sent', {
            amount: payout.amount_ghs,
            momoNumber: trainer.momo_number,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSub);
      supabase.removeChannel(messageSub);
      supabase.removeChannel(profileSub);
      supabase.removeChannel(reviewSub);
      supabase.removeChannel(cancelSub);
      supabase.removeChannel(payoutSub);
    };
  }, [trainer?.id, trainer?.owner_id, trainer?.momo_number]);

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
    </Router>
  );
}
