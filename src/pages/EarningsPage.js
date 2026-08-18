/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import {
  RiMoneyDollarCircleLine,
  RiCalendarEventLine,
  RiTrophyLine,
  RiBarChartBoxLine,
} from 'react-icons/ri';

export default function EarningsPage({ trainer }) {
  const [earnings, setEarnings] = useState({
    totalGross: 0,
    totalEarnings: 0,
    platformCut: 0,
    thisMonthGross: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    byMonth: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trainer?.id) loadEarnings();
    else setLoading(false);
  }, [trainer]);

  const loadEarnings = async () => {
    try {
      const { data: bookings } = await supabase
        .from('trainer_bookings')
        .select('amount_ghs, created_at, session_date')
        .eq('trainer_id', trainer.id);

      const all = bookings || [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const totalGross = all.reduce((s, b) => s + (b.amount_ghs || 0), 0);
      const totalEarnings = totalGross * 0.85;
      const platformCut = totalGross * 0.15;

      const monthBookings = all.filter(
        (b) => new Date(b.created_at) >= monthStart,
      );
      const thisMonthGross = monthBookings.reduce(
        (s, b) => s + (b.amount_ghs || 0),
        0,
      );

      const lastMonthBookings = all.filter((b) => {
        const d = new Date(b.created_at);
        return d >= lastMonthStart && d <= lastMonthEnd;
      });
      const lastMonthGross = lastMonthBookings.reduce(
        (s, b) => s + (b.amount_ghs || 0),
        0,
      );

      const byMonth = {};
      all.forEach((b) => {
        const key = new Date(b.created_at).toLocaleDateString('en-GB', {
          month: 'short',
          year: 'numeric',
        });
        if (!byMonth[key]) byMonth[key] = 0;
        byMonth[key] += b.amount_ghs || 0;
      });

      setEarnings({
        totalGross,
        totalEarnings,
        platformCut,
        thisMonthGross,
        thisMonthEarnings: thisMonthGross * 0.85,
        lastMonthEarnings: lastMonthGross * 0.85,
        byMonth: Object.entries(byMonth).map(([month, gross]) => ({
          month,
          gross,
          earnings: gross * 0.85,
        })),
      });
    } catch (e) {
      console.log('Earnings error:', e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'This Month',
      value: formatCurrency(earnings.thisMonthEarnings),
      Icon: RiCalendarEventLine,
      color: '#30D158',
      sub: `from ${formatCurrency(earnings.thisMonthGross)} gross`,
    },
    {
      label: 'Last Month',
      value: formatCurrency(earnings.lastMonthEarnings),
      Icon: RiBarChartBoxLine,
      color: '#06B6D4',
      sub: 'previous month',
    },
    {
      label: 'All Time',
      value: formatCurrency(earnings.totalEarnings),
      Icon: RiTrophyLine,
      color: '#F5C842',
      sub: `${formatCurrency(earnings.totalGross)} gross`,
    },
    {
      label: 'Platform Cut',
      value: formatCurrency(earnings.platformCut),
      Icon: RiMoneyDollarCircleLine,
      color: '#8B5CF6',
      sub: '15% commission',
    },
  ];

  if (!trainer) {
    return (
      <p style={{ color: 'var(--text-secondary)' }}>Complete your profile first.</p>
    );
  }

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
          Earnings
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
          Your revenue from Sankofa Fit sessions
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 24,
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}
      >
        💡 You keep{' '}
        <strong style={{ color: '#30D158' }}>85%</strong> of every session fee.
        Sankofa Fit takes{' '}
        <strong style={{ color: '#8B5CF6' }}>15%</strong> commission.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14,
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
                fontSize: 20,
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
          padding: 24,
          border: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            color: 'var(--text-primary)',
            fontSize: 16,
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          Monthly Breakdown
        </h2>
        {earnings.byMonth.length === 0 ? (
          <p
            style={{
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: 20,
            }}
          >
            No earnings yet. Start getting bookings!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr>
                  {['Month', 'Gross', 'Platform (15%)', 'Your Earnings'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          padding: '8px 12px',
                          textAlign: 'left',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {earnings.byMonth.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td style={tdStyle}>{row.month}</td>
                    <td style={tdStyle}>{formatCurrency(row.gross)}</td>
                    <td style={{ ...tdStyle, color: '#8B5CF6' }}>
                      {formatCurrency(row.gross * 0.15)}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: '#30D158',
                        fontWeight: 700,
                      }}
                    >
                      {formatCurrency(row.earnings)}
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
  padding: '12px',
};
