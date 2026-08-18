/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  RiStoreLine,
  RiMapPinLine,
  RiAddCircleLine,
  RiCheckboxCircleLine,
} from 'react-icons/ri';

export default function GymsPage({ trainer }) {
  const [allGyms, setAllGyms] = useState([]);
  const [trainerGyms, setTrainerGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (trainer?.id) loadData();
  }, [trainer]);

  const loadData = async () => {
    try {
      const { data: gyms } = await supabase
        .from('gyms')
        .select('id, name, city, address, cover_image_url')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('name');

      const { data: trainerGymData } = await supabase
        .from('trainer_gyms')
        .select('gym_id')
        .eq('trainer_id', trainer.id);

      setAllGyms(gyms || []);
      setTrainerGyms(
        (trainerGymData || []).map(tg => tg.gym_id)
      );
    } catch (e) {
      console.log('Load gyms error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGym = async (gymId) => {
    setSaving(gymId);
    try {
      const isLinked = trainerGyms.includes(gymId);

      if (isLinked) {
        await supabase
          .from('trainer_gyms')
          .delete()
          .eq('trainer_id', trainer.id)
          .eq('gym_id', gymId);

        setTrainerGyms(prev =>
          prev.filter(id => id !== gymId)
        );
      } else {
        await supabase
          .from('trainer_gyms')
          .insert({
            trainer_id: trainer.id,
            gym_id: gymId,
          });

        setTrainerGyms(prev => [...prev, gymId]);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(null);
    }
  };

  const filtered = allGyms.filter(gym =>
    !search ||
    gym.name?.toLowerCase()
      .includes(search.toLowerCase()) ||
    gym.city?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          color: 'var(--text-primary)', fontSize: 24,
          fontWeight: 900, margin: 0,
        }}>
          My Gyms
        </h1>
        <p style={{
          color: 'var(--text-secondary)', marginTop: 4,
          fontSize: 14,
        }}>
          Select gyms where you offer
          in-person training sessions.
          {trainerGyms.length > 0 && (
            <span style={{
              color: '#8B5CF6',
              fontWeight: 700,
              marginLeft: 8,
            }}>
              {trainerGyms.length} gym
              {trainerGyms.length > 1 ? 's' : ''}
              {' '}selected
            </span>
          )}
        </p>
      </div>

      <div style={{
        backgroundColor: 'rgba(139,92,246,0.06)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 20,
        color: 'var(--text-secondary)',
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        💡 Select gyms where clients can book
        in-person sessions with you.
        These gyms will appear on your trainer
        profile in the Sankofa Fit app.
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search gyms by name or city..."
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-input)',
          borderRadius: 10,
          padding: '11px 14px',
          color: 'var(--text-primary)',
          fontSize: 13,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          Loading gyms...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 20,
          border: '1px solid var(--border)',
        }}>
          <RiStoreLine
            size={48}
            color="rgba(139,92,246,0.3)"
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>
            {search
              ? 'No gyms match your search'
              : 'No approved gyms available yet'
            }
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {filtered.map(gym => {
            const isLinked =
              trainerGyms.includes(gym.id);
            return (
              <div key={gym.id} style={{
                backgroundColor: isLinked
                  ? 'rgba(139,92,246,0.1)'
                  : 'rgba(27,47,107,0.3)',
                borderRadius: 14,
                border: `1px solid ${isLinked
                  ? 'rgba(139,92,246,0.4)'
                  : 'rgba(255,255,255,0.06)'
                }`,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 12,
                  backgroundColor:
                    'rgba(139,92,246,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {gym.cover_image_url ? (
                    <img
                      src={gym.cover_image_url}
                      alt={gym.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <RiStoreLine
                      size={24}
                      color="#8B5CF6"
                    />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    color: 'var(--text-primary)',
                    fontSize: 15, fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    {gym.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                  }}>
                    <RiMapPinLine size={12} />
                    {gym.city}
                    {gym.address && (
                      <span> · {gym.address}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleToggleGym(gym.id)
                  }
                  disabled={saving === gym.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: isLinked
                      ? '#8B5CF6'
                      : 'rgba(139,92,246,0.1)',
                    border: `1px solid ${isLinked
                      ? '#8B5CF6'
                      : 'rgba(139,92,246,0.3)'
                    }`,
                    borderRadius: 10,
                    padding: '9px 16px',
                    color: isLinked
                      ? 'white' : '#8B5CF6',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity:
                      saving === gym.id ? 0.6 : 1,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {saving === gym.id ? (
                    '...'
                  ) : isLinked ? (
                    <>
                      <RiCheckboxCircleLine size={14} />
                      Added
                    </>
                  ) : (
                    <>
                      <RiAddCircleLine size={14} />
                      Add Gym
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
