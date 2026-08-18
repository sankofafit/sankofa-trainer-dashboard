import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  RiAddCircleLine,
  RiEditLine,
  RiDeleteBinLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

const SESSION_TYPES = [
  'One-on-One Training',
  'Group Session',
  'Online Coaching',
  'HIIT Training',
  'Weight Training',
  'Cardio Session',
  'Yoga Session',
  'Boxing Training',
  'Nutrition Consultation',
  'Assessment Session',
  'Other',
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 75, label: '1 hour 15 minutes' },
  { value: 90, label: '1 hour 30 minutes' },
  { value: 105, label: '1 hour 45 minutes' },
  { value: 120, label: '2 hours (Maximum)' },
];

const formatDuration = (mins) => {
  if (mins < 60) return `${mins} mins`;
  if (mins === 60) return '1 hour';
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (remaining === 0) return `${hours} hours`;
  return `${hours}hr ${remaining}mins`;
};

export default function SessionsPage({ trainer }) {
  const isMobile = useIsMobile();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: 'One-on-One Training',
    description: '',
    duration_mins: 60,
    price_ghs: '',
    max_clients: 1,
    session_type: 'in-person',
  });

  useEffect(() => {
    if (trainer?.id) loadSessions();
    else setLoading(false);
  }, [trainer]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('trainer_sessions')
      .select('*')
      .eq('trainer_id', trainer.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setSessions(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: 'One-on-One Training',
      description: '',
      duration_mins: 60,
      price_ghs: '',
      max_clients: 1,
      session_type: 'in-person',
    });
    setEditingSession(null);
    setError('');
  };

  const handleEdit = (session) => {
    setForm({
      name: session.name,
      description: session.description || '',
      duration_mins: session.duration_mins || 60,
      price_ghs: session.price_ghs || '',
      max_clients: session.max_clients || 1,
      session_type: session.session_type || 'in-person',
    });
    setEditingSession(session);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const duration = parseInt(form.duration_mins, 10);

    if (duration < 30) {
      setError('Minimum session duration is 30 minutes');
      return;
    }

    if (duration > 120) {
      setError('Maximum session duration is 2 hours');
      return;
    }

    if (!form.price_ghs) {
      setError('Price is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const sessionData = {
        trainer_id: trainer.id,
        name: form.name,
        description: form.description.trim(),
        duration_mins: duration,
        price_ghs: parseFloat(form.price_ghs),
        max_clients: parseInt(form.max_clients, 10),
        session_type: form.session_type,
        is_active: true,
      };

      if (editingSession) {
        const { error: updateError } = await supabase
          .from('trainer_sessions')
          .update(sessionData)
          .eq('id', editingSession.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('trainer_sessions')
          .insert(sessionData);
        if (insertError) throw insertError;
      }

      await loadSessions();
      setShowForm(false);
      resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session type?')) return;
    await supabase
      .from('trainer_sessions')
      .update({ is_active: false })
      .eq('id', id);
    await loadSessions();
  };

  if (!trainer) {
    return (
      <p style={{ color: '#6B7B99' }}>Complete your profile first.</p>
    );
  }

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
          <h1
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: 900,
              margin: 0,
            }}
          >
            My Sessions
          </h1>
          <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
            Set your session types and pricing
          </p>
        </div>
        <button
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
          Add Session
        </button>
      </div>

      {showForm && (
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
            <h2
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 800,
                margin: 0,
              }}
            >
              {editingSession ? 'Edit Session' : 'New Session Type'}
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

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
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
          )}

          <form onSubmit={handleSave}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Session Type *</label>
                <select
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  style={{ ...inputStyle, appearance: 'none' }}
                >
                  {SESSION_TYPES.map((t) => (
                    <option
                      key={t}
                      value={t}
                      style={{ backgroundColor: '#0D1B45' }}
                    >
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Format</label>
                <select
                  value={form.session_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      session_type: e.target.value,
                    }))
                  }
                  style={{ ...inputStyle, appearance: 'none' }}
                >
                  {[
                    { value: 'in-person', label: 'In Person' },
                    { value: 'online', label: 'Online / Virtual' },
                    { value: 'both', label: 'Both Options' },
                  ].map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      style={{ backgroundColor: '#0D1B45' }}
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Describe what's included..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <label style={labelStyle}>Session Duration *</label>
                <select
                  value={form.duration_mins}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      duration_mins: parseInt(e.target.value, 10),
                    }))
                  }
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{ backgroundColor: '#0D1B45' }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    color: '#6B7B99',
                    fontSize: 11,
                    marginTop: 6,
                  }}
                >
                  Min 30 minutes · Max 2 hours
                </div>
              </div>
              <div>
                <label style={labelStyle}>Price (GHS) *</label>
                <input
                  type="number"
                  value={form.price_ghs}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price_ghs: e.target.value }))
                  }
                  placeholder="e.g. 100"
                  min={1}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Max Clients</label>
                <input
                  type="number"
                  value={form.max_clients}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      max_clients: e.target.value,
                    }))
                  }
                  min={1}
                  max={50}
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
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
                {saving
                  ? 'Saving...'
                  : editingSession
                    ? 'Update Session'
                    : 'Add Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6B7B99' }}>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <MdFitnessCenter
            size={48}
            color="rgba(139,92,246,0.3)"
            style={{ marginBottom: 16 }}
          />
          <h3 style={{ color: 'white', marginBottom: 8 }}>
            No sessions yet
          </h3>
          <p style={{ color: '#6B7B99', marginBottom: 24 }}>
            Add your first session type to start receiving bookings
          </p>
          <button
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
            + Add First Session
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}
        >
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                backgroundColor: 'rgba(27,47,107,0.4)',
                borderRadius: 16,
                border: '1px solid rgba(139,92,246,0.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      color: 'white',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    {session.name}
                  </div>
                  <div
                    style={{
                      color: '#F5C842',
                      fontSize: 18,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    GHS {session.price_ghs}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={tagStyle('#8B5CF6')}>
                    {session.session_type || 'in-person'}
                  </span>
                  <span style={tagStyle('#06B6D4')}>
                    ⏱ {formatDuration(session.duration_mins)}
                  </span>
                  <span style={tagStyle('#30D158')}>
                    Max {session.max_clients} client
                    {session.max_clients > 1 ? 's' : ''}
                  </span>
                </div>
                {session.description && (
                  <p
                    style={{
                      color: '#6B7B99',
                      fontSize: 12,
                      marginTop: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {session.description}
                  </p>
                )}
              </div>
              <div
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleEdit(session)}
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
                  onClick={() => handleDelete(session.id)}
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
          ))}
        </div>
      )}
    </div>
  );
}

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

const tagStyle = (color) => ({
  backgroundColor: `${color}18`,
  color,
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 700,
  border: `1px solid ${color}30`,
});
