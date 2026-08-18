/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  RiAddCircleLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCalendarEventLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
} from 'react-icons/ri';

const SUBSCRIPTION_TYPES = [
  {
    id: 'weekly',
    label: 'Weekly',
    description: '1 week subscription',
    days: 7,
  },
  {
    id: 'monthly',
    label: 'Monthly',
    description: '1 month subscription',
    days: 30,
  },
  {
    id: '3_months',
    label: '3 Months',
    description: '3 month subscription',
    days: 90,
  },
  {
    id: '6_months',
    label: '6 Months',
    description: '6 month subscription',
    days: 180,
  },
];

const SESSIONS_PER_WEEK = [1, 2, 3, 4, 5, 6, 7];

const labelStyle = {
  display: 'block',
  color: '#6B7B99',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  marginBottom: 8,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

export default function SubscriptionsPage({ trainer }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'monthly',
    sessions_per_week: 3,
    price_ghs: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (trainer?.id) loadSubscriptions();
  }, [trainer]);

  const loadSubscriptions = async () => {
    try {
      const { data } = await supabase
        .from('trainer_subscriptions')
        .select('*')
        .eq('trainer_id', trainer.id)
        .order('created_at', { ascending: true });
      setSubscriptions(data || []);
    } catch (e) {
      console.log('Load subs error:', e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      type: 'monthly',
      sessions_per_week: 3,
      price_ghs: '',
      description: '',
      is_active: true,
    });
    setEditingSub(null);
    setError('');
  };

  const handleEdit = (sub) => {
    setForm({
      type: sub.type,
      sessions_per_week: sub.sessions_per_week,
      price_ghs: sub.price_ghs,
      description: sub.description || '',
      is_active: sub.is_active,
    });
    setEditingSub(sub);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.price_ghs) {
      setError('Price is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const subData = {
        trainer_id: trainer.id,
        type: form.type,
        sessions_per_week: parseInt(form.sessions_per_week, 10),
        price_ghs: parseFloat(form.price_ghs),
        description: form.description.trim(),
        is_active: true,
        duration_days: SUBSCRIPTION_TYPES.find((t) => t.id === form.type)?.days || 30,
      };

      if (editingSub) {
        await supabase
          .from('trainer_subscriptions')
          .update(subData)
          .eq('id', editingSub.id);
      } else {
        await supabase.from('trainer_subscriptions').insert(subData);
      }

      await loadSubscriptions();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription plan?')) return;
    await supabase.from('trainer_subscriptions').delete().eq('id', id);
    await loadSubscriptions();
  };

  const getTypeInfo = (type) => SUBSCRIPTION_TYPES.find((t) => t.id === type);

  const getTotalSessions = (sub) => {
    const typeInfo = getTypeInfo(sub.type);
    const weeks = Math.floor((typeInfo?.days || 30) / 7);
    return weeks * sub.sessions_per_week;
  };

  const getPricePerSession = (sub) => {
    const total = getTotalSessions(sub);
    return total > 0 ? (sub.price_ghs / total).toFixed(2) : 0;
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>
            Subscription Plans
          </h1>
          <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
            Create weekly or monthly training packages for clients
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={{
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '11px 20px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <RiAddCircleLine size={18} />
          Add Plan
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#6B7B99',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        💡 Create subscription packages for clients who want regular training. Set how many
        sessions per week and the total price for the period.
      </div>

      {showForm ? (
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.4)',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            border: '1px solid rgba(139,92,246,0.3)',
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
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>
              {editingSub ? 'Edit Plan' : 'New Subscription Plan'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7B99',
                fontSize: 20,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {error ? (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: 12,
                color: '#EF4444',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Subscription Period *</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                }}
              >
                {SUBSCRIPTION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: type.id }))}
                    style={{
                      backgroundColor:
                        form.type === type.id
                          ? 'rgba(139,92,246,0.2)'
                          : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${
                        form.type === type.id ? '#8B5CF6' : 'rgba(255,255,255,0.1)'
                      }`,
                      borderRadius: 12,
                      padding: '14px',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        marginBottom: 2,
                        color: form.type === type.id ? '#8B5CF6' : 'white',
                      }}
                    >
                      {type.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7B99' }}>{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Sessions Per Week *</label>
                <select
                  value={form.sessions_per_week}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sessions_per_week: parseInt(e.target.value, 10),
                    }))
                  }
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                  }}
                >
                  {SESSIONS_PER_WEEK.map((n) => (
                    <option key={n} value={n} style={{ backgroundColor: '#0D1B45' }}>
                      {n} session{n > 1 ? 's' : ''} per week
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Total Price (GHS) *</label>
                <input
                  type="number"
                  value={form.price_ghs}
                  onChange={(e) => setForm((p) => ({ ...p, price_ghs: e.target.value }))}
                  placeholder="e.g. 500"
                  min={1}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            {form.price_ghs && form.sessions_per_week ? (
              <div
                style={{
                  backgroundColor: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  gap: 20,
                  flexWrap: 'wrap',
                }}
              >
                {(() => {
                  const typeInfo = getTypeInfo(form.type);
                  const weeks = Math.floor((typeInfo?.days || 30) / 7);
                  const totalSessions = weeks * parseInt(form.sessions_per_week, 10);
                  const perSession =
                    totalSessions > 0
                      ? (parseFloat(form.price_ghs) / totalSessions).toFixed(2)
                      : 0;

                  return (
                    <>
                      <div>
                        <div
                          style={{
                            color: '#6B7B99',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 1,
                            marginBottom: 2,
                          }}
                        >
                          TOTAL SESSIONS
                        </div>
                        <div style={{ color: '#8B5CF6', fontSize: 18, fontWeight: 900 }}>
                          {totalSessions}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            color: '#6B7B99',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 1,
                            marginBottom: 2,
                          }}
                        >
                          PER SESSION
                        </div>
                        <div style={{ color: '#F5C842', fontSize: 18, fontWeight: 900 }}>
                          GHS {perSession}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            color: '#6B7B99',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 1,
                            marginBottom: 2,
                          }}
                        >
                          YOUR EARNINGS
                        </div>
                        <div style={{ color: '#30D158', fontSize: 18, fontWeight: 900 }}>
                          GHS {(parseFloat(form.price_ghs) * 0.85).toFixed(2)}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What's included in this plan..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  padding: '11px 20px',
                  color: '#6B7B99',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: '#8B5CF6',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 24px',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : editingSub ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {loading ? (
        <p style={{ color: '#6B7B99' }}>Loading plans...</p>
      ) : subscriptions.length === 0 && !showForm ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RiCalendarEventLine
            size={48}
            color="rgba(139,92,246,0.3)"
            style={{ marginBottom: 16 }}
          />
          <h3 style={{ color: 'white', marginBottom: 8 }}>No subscription plans yet</h3>
          <p style={{ color: '#6B7B99', marginBottom: 24 }}>
            Create subscription packages to offer clients regular training sessions
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            + Create First Plan
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {subscriptions.map((sub) => {
            const typeInfo = getTypeInfo(sub.type);
            const totalSessions = getTotalSessions(sub);
            const perSession = getPricePerSession(sub);

            return (
              <div
                key={sub.id}
                style={{
                  backgroundColor: 'rgba(27,47,107,0.4)',
                  borderRadius: 16,
                  border: '1px solid rgba(139,92,246,0.2)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(27,47,107,0.6))',
                    padding: '20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#8B5CF6',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 1,
                          marginBottom: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {typeInfo?.label}
                      </div>
                      <div style={{ color: 'white', fontSize: 22, fontWeight: 900 }}>
                        GHS {sub.price_ghs}
                      </div>
                      <div style={{ color: '#6B7B99', fontSize: 12, marginTop: 2 }}>
                        GHS {perSession} per session
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'rgba(139,92,246,0.2)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        textAlign: 'center',
                        border: '1px solid rgba(139,92,246,0.3)',
                      }}
                    >
                      <div style={{ color: '#8B5CF6', fontSize: 22, fontWeight: 900 }}>
                        {sub.sessions_per_week}x
                      </div>
                      <div style={{ color: '#6B7B99', fontSize: 10, fontWeight: 700 }}>
                        PER WEEK
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px 20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginBottom: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#6B7B99',
                        fontSize: 12,
                      }}
                    >
                      <RiTimeLine size={13} />
                      {typeInfo?.days} days
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#6B7B99',
                        fontSize: 12,
                      }}
                    >
                      <RiCalendarEventLine size={13} />
                      {totalSessions} total sessions
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#30D158',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <RiMoneyDollarCircleLine size={13} />
                      You earn: GHS {(sub.price_ghs * 0.85).toFixed(2)}
                    </div>
                  </div>

                  {sub.description ? (
                    <p
                      style={{
                        color: '#6B7B99',
                        fontSize: 12,
                        lineHeight: 1.5,
                        marginBottom: 10,
                      }}
                    >
                      {sub.description}
                    </p>
                  ) : null}
                </div>

                <div
                  style={{
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleEdit(sub)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: 8,
                      padding: '8px',
                      color: '#8B5CF6',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <RiEditLine size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sub.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8,
                      padding: '8px',
                      color: '#EF4444',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <RiDeleteBinLine size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
