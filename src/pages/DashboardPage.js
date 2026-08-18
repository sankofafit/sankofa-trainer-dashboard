/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  RiCalendarEventLine,
  RiMoneyDollarCircleLine,
  RiUserHeartLine,
  RiStarLine,
  RiTimeLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

export default function DashboardPage({ trainer }) {
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    totalBookings: 0,
    monthRevenue: 0,
    totalRevenue: 0,
    trainerEarnings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState(null);

  useEffect(() => {
    if (!trainer?.id) {
      setLoading(false);
      return;
    }

    loadStats();

    const trainerId = String(trainer.id);

    const sub = supabase
      .channel(`trainer_dash_${trainerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trainer_bookings',
          filter: `trainer_id=eq.${trainerId}`,
        },
        (payload) => {
          console.log('New booking received!');
          setNewBookingAlert({
            show: true,
            session: payload.new?.session_type,
            date: payload.new?.session_date,
            time: payload.new?.session_time,
            amount: payload.new?.amount_ghs,
          });
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('🎉 New Booking!', {
              body: `${payload.new?.session_type} · ${payload.new?.session_date} · GHS ${payload.new?.amount_ghs}`,
              icon: '/favicon.ico',
            });
          }
          loadStats();
        },
      )
      .subscribe();

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(sub);
    };
  }, [trainer]);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: bookings } = await supabase
        .from('trainer_bookings')
        .select('*')
        .eq('trainer_id', trainer.id)
        .order('created_at', { ascending: false });

      const all = bookings || [];
      const todayB = all.filter(
        (b) =>
          b.session_date?.startsWith(today) ||
          b.created_at?.startsWith(today),
      );
      const weekB = all.filter((b) => new Date(b.created_at) >= weekAgo);
      const monthRevenue = all
        .filter((b) => new Date(b.created_at) >= monthStart)
        .reduce((s, b) => s + (b.amount_ghs || 0), 0);
      const totalRevenue = all.reduce(
        (s, b) => s + (b.amount_ghs || 0),
        0,
      );

      setStats({
        todayBookings: todayB.length,
        weekBookings: weekB.length,
        totalBookings: all.length,
        monthRevenue,
        totalRevenue,
        trainerEarnings: totalRevenue * 0.85,
      });
      setRecentBookings(all.slice(0, 8));
    } catch (e) {
      console.log('Stats error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!trainer) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 60,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 20,
          border: '1px solid var(--border)',
        }}
      >
        <RiUserHeartLine
          size={64}
          color="rgba(139,92,246,0.3)"
          style={{ marginBottom: 16 }}
        />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
          Complete Your Profile
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Set up your trainer profile to start receiving bookings on Sankofa Fit
        </p>
        <Link
          to="/profile"
          style={{
            backgroundColor: '#8B5CF6',
            color: 'var(--text-primary)',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Set Up Profile <RiArrowRightLine size={16} />
        </Link>
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Sessions",
      value: stats.todayBookings,
      Icon: RiCalendarEventLine,
      color: '#F5C842',
      sub: 'booked today',
    },
    {
      label: 'This Week',
      value: stats.weekBookings,
      Icon: MdFitnessCenter,
      color: '#8B5CF6',
      sub: 'sessions this week',
    },
    {
      label: 'Month Revenue',
      value: formatCurrency(stats.monthRevenue),
      Icon: RiMoneyDollarCircleLine,
      color: '#30D158',
      sub: 'gross this month',
    },
    {
      label: 'Your Earnings',
      value: formatCurrency(stats.trainerEarnings),
      Icon: RiStarLine,
      color: '#06B6D4',
      sub: '85% after commission',
    },
  ];

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
          Welcome back, {trainer.name}! 💪
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
          {trainer.speciality} · {trainer.city}
        </p>
      </div>

      {newBookingAlert?.show ? (
        <div
          style={{
            backgroundColor: 'rgba(48,209,88,0.1)',
            border: '1px solid rgba(48,209,88,0.4)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <div
                style={{
                  color: '#30D158',
                  fontWeight: 800,
                  fontSize: 15,
                  marginBottom: 4,
                }}
              >
                New Booking!
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {newBookingAlert.session} · {newBookingAlert.date} ·{' '}
                {newBookingAlert.time} · GHS {newBookingAlert.amount}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewBookingAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>
      ) : null}

      {!trainer.is_approved && (
        <div
          style={{
            backgroundColor: 'rgba(245,200,66,0.06)',
            border: '1px solid rgba(245,200,66,0.2)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <RiTimeLine size={24} color="#F5C842" />
          <div>
            <div
              style={{
                color: '#F5C842',
                fontWeight: 800,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              Your profile is under review
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Sankofa Fit admin will approve your profile within 24-48 hours.
              Complete your profile while you wait!
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 16,
              padding: 18,
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                backgroundColor: `${card.color}15`,
                border: `1px solid ${card.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <card.Icon size={20} color={card.color} />
            </div>
            <div
              style={{
                color: card.color,
                fontSize: 22,
                fontWeight: 900,
                marginBottom: 4,
              }}
            >
              {loading ? '...' : card.value}
            </div>
            <div
              style={{
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {card.label}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 800,
              margin: 0,
            }}
          >
            Recent Bookings
          </h3>
          <Link
            to="/bookings"
            style={{
              color: '#F5C842',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            View All →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <RiCalendarEventLine
              size={40}
              color="rgba(245,200,66,0.2)"
              style={{ marginBottom: 12 }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>
              No bookings yet. Once your profile is approved clients can book
              you!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 500,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {['Session', 'Date', 'Amount', 'Your Cut', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          padding: '10px 16px',
                          textAlign: 'left',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking, i) => (
                  <tr
                    key={booking.id || i}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td style={tdStyle}>
                      {booking.session_type || 'Session'}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      {formatDate(
                        booking.session_date || booking.created_at,
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      GHS {booking.amount_ghs}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: '#30D158',
                        fontWeight: 700,
                      }}
                    >
                      GHS {((booking.amount_ghs || 0) * 0.85).toFixed(2)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          backgroundColor: 'rgba(48,209,88,0.1)',
                          color: '#30D158',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {booking.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const tdStyle = {
  color: 'var(--text-primary)',
  fontSize: 13,
  padding: '13px 16px',
};
