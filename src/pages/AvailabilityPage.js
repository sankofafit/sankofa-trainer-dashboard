import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_AVAILABILITY = {
  Monday: { available: true, start: '07:00', end: '18:00' },
  Tuesday: { available: true, start: '07:00', end: '18:00' },
  Wednesday: { available: true, start: '07:00', end: '18:00' },
  Thursday: { available: true, start: '07:00', end: '18:00' },
  Friday: { available: true, start: '07:00', end: '18:00' },
  Saturday: { available: true, start: '08:00', end: '14:00' },
  Sunday: { available: false, start: '08:00', end: '12:00' },
};

export default function AvailabilityPage({ trainer }) {
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (trainer?.availability) {
      setAvailability({
        ...DEFAULT_AVAILABILITY,
        ...trainer.availability,
      });
    }
  }, [trainer]);

  const handleSave = async () => {
    if (!trainer?.id) return;
    setSaving(true);
    setSuccess('');
    try {
      await supabase
        .from('trainers')
        .update({ availability })
        .eq('id', trainer.id);
      setSuccess('✅ Availability saved!');
    } catch (e) {
      console.log('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available,
      },
    }));
  };

  const updateTime = (day, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  if (!trainer) {
    return (
      <p style={{ color: '#6B7B99' }}>Complete your profile first.</p>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 900,
            margin: 0,
          }}
        >
          Availability
        </h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
          Set the days and hours you are available for sessions
        </p>
      </div>

      {success && (
        <div
          style={{
            backgroundColor: 'rgba(48,209,88,0.08)',
            border: '1px solid rgba(48,209,88,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#30D158',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}
      >
        {DAYS.map((day, i) => {
          const dayData = availability[day] || DEFAULT_AVAILABILITY[day];
          return (
            <div
              key={day}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 0',
                borderBottom:
                  i < DAYS.length - 1
                    ? '1px solid rgba(255,255,255,0.06)'
                    : 'none',
                flexWrap: 'wrap',
              }}
            >
              <div
                onClick={() => toggleDay(day)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  minWidth: 130,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: dayData.available
                      ? '#8B5CF6'
                      : 'rgba(255,255,255,0.1)',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: 3,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: 'white',
                      transition: 'transform 0.2s',
                      transform: dayData.available
                        ? 'translateX(18px)'
                        : 'translateX(0)',
                    }}
                  />
                </div>
                <span
                  style={{
                    color: dayData.available ? 'white' : '#6B7B99',
                    fontSize: 14,
                    fontWeight: dayData.available ? 700 : 400,
                  }}
                >
                  {day}
                </span>
              </div>

              {dayData.available ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <input
                    type="time"
                    value={dayData.start}
                    onChange={(e) =>
                      updateTime(day, 'start', e.target.value)
                    }
                    style={timeInputStyle}
                  />
                  <span style={{ color: '#6B7B99', fontSize: 12 }}>to</span>
                  <input
                    type="time"
                    value={dayData.end}
                    onChange={(e) => updateTime(day, 'end', e.target.value)}
                    style={timeInputStyle}
                  />
                </div>
              ) : (
                <span
                  style={{
                    color: '#EF4444',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Not Available
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <span
          style={{
            color: '#6B7B99',
            fontSize: 12,
            alignSelf: 'center',
          }}
        >
          Quick set:
        </span>
        <button
          type="button"
          onClick={() => {
            const updated = {};
            DAYS.forEach((d) => {
              updated[d] = {
                available: true,
                start: '06:00',
                end: '20:00',
              };
            });
            setAvailability(updated);
          }}
          style={quickBtnStyle('#30D158')}
        >
          All Days
        </button>
        <button
          type="button"
          onClick={() => {
            const updated = { ...availability };
            ['Saturday', 'Sunday'].forEach((d) => {
              updated[d] = { ...updated[d], available: false };
            });
            setAvailability(updated);
          }}
          style={quickBtnStyle('#F5C842')}
        >
          Weekdays Only
        </button>
        <button
          type="button"
          onClick={() => setAvailability(DEFAULT_AVAILABILITY)}
          style={quickBtnStyle('#8B5CF6')}
        >
          Reset Default
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          backgroundColor: saving ? 'rgba(139,92,246,0.5)' : '#8B5CF6',
          color: 'white',
          border: 'none',
          borderRadius: 14,
          padding: '15px',
          fontSize: 15,
          fontWeight: 900,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? '⏳ Saving...' : '💾 Save Availability'}
      </button>
    </div>
  );
}

const timeInputStyle = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '7px 10px',
  color: 'white',
  fontSize: 13,
  outline: 'none',
};

const quickBtnStyle = (color) => ({
  backgroundColor: `${color}10`,
  border: `1px solid ${color}30`,
  borderRadius: 8,
  padding: '7px 14px',
  color,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
});
