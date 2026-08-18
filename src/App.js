import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
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

  const loadTrainer = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('owner_id', userId)
        .single();

      console.log('Trainer loaded in App.js:');
      console.log('trainer.id:', data?.id);
      console.log('trainer.owner_id:', data?.owner_id);
      console.log('trainer.name:', data?.name);
      console.log('Trainer error:', error);

      if (error && error.code !== 'PGRST116') {
        console.log('Real error loading trainer:', error);
      }

      setTrainer(data || null);
    } catch (e) {
      console.log('Load trainer error:', e);
      setTrainer(null);
    } finally {
      setLoading(false);
    }
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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        setLoading(true);
        loadTrainer(nextSession.user.id);
      } else {
        setTrainer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadTrainer]);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080C1C',
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
        <div style={{ color: '#6B7B99', fontSize: 13 }}>Trainer Dashboard</div>
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
