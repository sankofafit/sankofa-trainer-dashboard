import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/formatters';
import {
  RiCalendarEventLine,
  RiUserHeartLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiTimeLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

export default function BookingsPage({ trainer }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [expandedBooking, setExpandedBooking] =
    useState(null);

  useEffect(() => {
    if (trainer?.id) {
      loadBookings();

      const sub = supabase
        .channel(`trainer_bookings_${trainer.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trainer_bookings',
            filter: `trainer_id=eq.${trainer.id}`,
          },
          () => loadBookings()
        )
        .subscribe();

      return () => supabase.removeChannel(sub);
    }
  }, [trainer]);

  const loadBookings = async () => {
    try {
      const { data: bookingsData, error } =
        await supabase
          .from('trainer_bookings')
          .select('*')
          .eq('trainer_id', trainer.id)
          .order('session_date', { ascending: true });

      if (error) {
        console.log('Load bookings error:', error);
        setLoading(false);
        return;
      }

      const userIds = [
        ...new Set(
          (bookingsData || [])
            .map(b => b.user_id)
            .filter(Boolean)
        ),
      ];

      let usersById = {};
      if (userIds.length > 0) {
        const { data: users, error: usersError } =
          await supabase
            .from('users')
            .select(
              'id, full_name, email, phone_gh, ' +
              'workout_goal, subscription_tier, ' +
              'gender, age, city'
            )
            .in('id', userIds);

        if (usersError) {
          console.log('Load users error:', usersError);
        } else {
          usersById = Object.fromEntries(
            (users || []).map(u => [u.id, u])
          );
        }
      }

      setBookings(
        (bookingsData || []).map(booking => ({
          ...booking,
          user: booking.user_id
            ? usersById[booking.user_id] || null
            : null,
        }))
      );
    } catch (e) {
      console.log('loadBookings error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (bookingId) => {
    if (!window.confirm(
      'Mark this session as completed?\n\n' +
      'This will free up the time slot for new bookings.'
    )) return;

    setProcessing(bookingId);
    try {
      const { error } = await supabase
        .from('trainer_bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;
      await loadBookings();
      alert('✅ Session marked as completed!');
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (bookingId) => {
    const reason = window.prompt(
      'Reason for cancelling this session?'
    );
    if (reason === null) return;

    setProcessing(bookingId);
    try {
      const { error } = await supabase
        .from('trainer_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          notes: reason,
        })
        .eq('id', bookingId);

      if (error) throw error;
      await loadBookings();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      b.session_type?.toLowerCase()
        .includes(search.toLowerCase()) ||
      b.user?.full_name?.toLowerCase()
        .includes(search.toLowerCase()) ||
      b.booking_reference?.toLowerCase()
        .includes(search.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      b.status === filter;

    return matchSearch && matchFilter;
  });

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter(
      b => b.status === 'confirmed'
    ).length,
    completed: bookings.filter(
      b => b.status === 'completed'
    ).length,
    cancelled: bookings.filter(
      b => b.status === 'cancelled'
    ).length,
  };

  const totalEarnings = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.amount_ghs || 0) * 0.85, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          color: 'white', fontSize: 24,
          fontWeight: 900, margin: 0,
        }}>
          Bookings
        </h1>
        <p style={{
          color: '#6B7B99', marginTop: 4,
          fontSize: 14,
        }}>
          {bookings.length} total ·
          Your earnings: GHS {totalEarnings.toFixed(2)}
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 6,
        marginBottom: 16, flexWrap: 'wrap',
      }}>
        {[
          { id: 'all', label: `All (${counts.all})` },
          {
            id: 'confirmed',
            label: `Upcoming (${counts.confirmed})`,
          },
          {
            id: 'completed',
            label: `Completed (${counts.completed})`,
          },
          {
            id: 'cancelled',
            label: `Cancelled (${counts.cancelled})`,
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              backgroundColor: filter === tab.id
                ? '#8B5CF6'
                : 'rgba(27,47,107,0.4)',
              color: filter === tab.id
                ? 'white' : '#6B7B99',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by client name or session..."
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '11px 14px',
          color: 'white',
          fontSize: 13,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      {loading ? (
        <p style={{ color: '#6B7B99' }}>
          Loading bookings...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <RiCalendarEventLine
            size={48}
            color="rgba(245,200,66,0.2)"
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: '#6B7B99' }}>
            {search
              ? 'No bookings match your search'
              : filter === 'confirmed'
                ? 'No upcoming sessions'
                : 'No bookings yet'
            }
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {filtered.map((booking) => (
            <div key={booking.id} style={{
              backgroundColor: 'rgba(27,47,107,0.3)',
              borderRadius: 16,
              border: `1px solid ${
                booking.status === 'confirmed'
                  ? 'rgba(139,92,246,0.3)'
                  : booking.status === 'completed'
                    ? 'rgba(48,209,88,0.2)'
                    : 'rgba(239,68,68,0.2)'
              }`,
              overflow: 'hidden',
            }}>
              <div
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
                onClick={() => setExpandedBooking(
                  expandedBooking === booking.id
                    ? null : booking.id
                )}
              >
                <div style={{
                  width: 50, height: 50,
                  borderRadius: 25,
                  backgroundColor:
                    'rgba(139,92,246,0.15)',
                  border:
                    '1px solid rgba(139,92,246,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <RiUserHeartLine
                    size={24}
                    color="#8B5CF6"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 4,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 800,
                    }}>
                      {booking.user?.full_name ||
                        'Client'}
                    </span>
                    <span style={{
                      backgroundColor:
                        booking.status === 'confirmed'
                          ? 'rgba(139,92,246,0.15)'
                          : booking.status ===
                              'completed'
                            ? 'rgba(48,209,88,0.15)'
                            : 'rgba(239,68,68,0.15)',
                      color:
                        booking.status === 'confirmed'
                          ? '#8B5CF6'
                          : booking.status ===
                              'completed'
                            ? '#30D158'
                            : '#EF4444',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}>
                      {booking.status}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 14,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#6B7B99',
                      fontSize: 12,
                    }}>
                      <MdFitnessCenter size={12} />
                      {booking.session_type || 'Session'}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#6B7B99',
                      fontSize: 12,
                    }}>
                      <RiCalendarEventLine size={12} />
                      {formatDate(booking.session_date)}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#6B7B99',
                      fontSize: 12,
                    }}>
                      <RiTimeLine size={12} />
                      {booking.session_time || '—'}
                    </div>
                    <div style={{
                      color: '#30D158',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      GHS {(
                        (booking.amount_ghs || 0) * 0.85
                      ).toFixed(2)} earned
                    </div>
                  </div>
                </div>

                <div style={{
                  color: '#6B7B99',
                  fontSize: 18,
                  transition: 'transform 0.2s',
                  transform:
                    expandedBooking === booking.id
                      ? 'rotate(180deg)'
                      : 'rotate(0)',
                }}>
                  ▾
                </div>
              </div>

              {expandedBooking === booking.id && (
                <div style={{
                  borderTop:
                    '1px solid rgba(255,255,255,0.06)',
                  padding: '16px 20px',
                }}>
                  <div style={{
                    backgroundColor:
                      'rgba(139,92,246,0.08)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 14,
                    border:
                      '1px solid rgba(139,92,246,0.15)',
                  }}>
                    <div style={{
                      color: '#8B5CF6',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1,
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      Client Information
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 12,
                    }}>
                      {[
                        {
                          icon: RiUserHeartLine,
                          label: 'Name',
                          value: booking.user?.full_name
                            || 'Unknown',
                          color: 'white',
                        },
                        {
                          icon: RiMailLine,
                          label: 'Email',
                          value: booking.user?.email
                            || '—',
                          color: '#06B6D4',
                        },
                        {
                          icon: RiPhoneLine,
                          label: 'Phone',
                          value: booking.user?.phone_gh
                            || '—',
                          color: '#30D158',
                        },
                        {
                          icon: MdFitnessCenter,
                          label: 'Goal',
                          value: booking.user
                            ?.workout_goal
                            ?.replace(/_/g, ' ')
                            || '—',
                          color: '#F5C842',
                        },
                        {
                          icon: RiMapPinLine,
                          label: 'City',
                          value: booking.user?.city
                            || '—',
                          color: '#8B5CF6',
                        },
                        {
                          icon: RiMoneyDollarCircleLine,
                          label: 'Plan',
                          value: booking.user
                            ?.subscription_tier
                            ?.toUpperCase()
                            || 'FREE',
                          color: '#8B5CF6',
                        },
                      ].map((item, j) => (
                        <div key={j} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <item.icon
                            size={14}
                            color="#6B7B99"
                          />
                          <div>
                            <div style={{
                              color: '#6B7B99',
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}>
                              {item.label}
                            </div>
                            <div style={{
                              color: item.color,
                              fontSize: 13,
                              fontWeight: 600,
                              marginTop: 2,
                            }}>
                              {item.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{
                      flex: 1,
                      backgroundColor:
                        'rgba(48,209,88,0.08)',
                      borderRadius: 10,
                      padding: 12,
                      border:
                        '1px solid rgba(48,209,88,0.15)',
                      minWidth: 150,
                    }}>
                      <div style={{
                        color: '#6B7B99',
                        fontSize: 10, marginBottom: 4,
                      }}>
                        Session Fee
                      </div>
                      <div style={{
                        color: 'white',
                        fontSize: 16, fontWeight: 800,
                      }}>
                        GHS {booking.amount_ghs}
                      </div>
                      <div style={{
                        color: '#30D158',
                        fontSize: 12, marginTop: 4,
                      }}>
                        You earn: GHS {(
                          (booking.amount_ghs || 0) *
                          0.85
                        ).toFixed(2)}
                      </div>
                    </div>

                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() =>
                            handleComplete(booking.id)
                          }
                          disabled={
                            processing === booking.id
                          }
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor:
                              '#30D158',
                            border: 'none',
                            borderRadius: 10,
                            padding: '12px',
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            opacity:
                              processing === booking.id
                                ? 0.6 : 1,
                            minWidth: 140,
                          }}
                        >
                          <RiCheckboxCircleLine
                            size={16}
                          />
                          {processing === booking.id
                            ? 'Updating...'
                            : '✓ Mark Complete'
                          }
                        </button>

                        <button
                          onClick={() =>
                            handleCancel(booking.id)
                          }
                          disabled={
                            processing === booking.id
                          }
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor:
                              'rgba(239,68,68,0.1)',
                            border:
                              '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 10,
                            padding: '12px',
                            color: '#EF4444',
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            minWidth: 120,
                          }}
                        >
                          <RiCloseCircleLine size={16} />
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === 'completed' && (
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor:
                          'rgba(48,209,88,0.1)',
                        borderRadius: 10,
                        padding: '12px',
                        color: '#30D158',
                        fontSize: 13,
                        fontWeight: 700,
                        minWidth: 140,
                      }}>
                        <RiCheckboxCircleLine size={16} />
                        Session Completed
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
