import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../hooks/useIsMobile';

const CITIES = [
  'Accra',
  'Kumasi',
  'Tamale',
  'Takoradi',
  'Cape Coast',
  'Sunyani',
  'Ho',
  'Koforidua',
];

const SPECIALITIES = [
  'Personal Training',
  'Weight Loss',
  'Muscle Building',
  'Cardio & Endurance',
  'Yoga & Flexibility',
  'Boxing & Martial Arts',
  'Nutrition Coaching',
  'Sports Performance',
  'Rehabilitation',
  'Group Fitness',
];

export default function ProfilePage({ trainer, setTrainer, userId }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({
    name: '',
    bio: '',
    speciality: 'Personal Training',
    experience_years: '',
    city: 'Accra',
    phone: '',
    certifications: [''],
    momo_provider: 'MTN',
    momo_number: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (trainer) {
      setForm({
        name: trainer.name || '',
        bio: trainer.bio || '',
        speciality: trainer.speciality || 'Personal Training',
        experience_years:
          trainer.experience_years != null && trainer.experience_years !== ''
            ? String(trainer.experience_years)
            : '',
        city: trainer.city || 'Accra',
        phone: trainer.phone || '',
        certifications: trainer.certifications?.length
          ? trainer.certifications
          : [''],
        momo_provider: trainer.momo_provider || 'MTN',
        momo_number: trainer.momo_number || '',
      });
    }
  }, [trainer]);

  const handlePhotoUpload = async (file) => {
    if (!trainer?.id) {
      setError('Save your profile first before uploading a photo');
      return;
    }
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      setUploadingPhoto(true);
      setError('');

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gym-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('gym-images').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('trainers')
        .update({ profile_image_url: publicUrl })
        .eq('id', trainer.id);

      if (updateError) throw updateError;

      setTrainer((prev) => ({
        ...prev,
        profile_image_url: publicUrl,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        speciality: form.speciality,
        experience_years: parseInt(form.experience_years, 10) || 0,
        city: form.city,
        phone: form.phone.trim(),
        certifications: form.certifications.filter((c) => c.trim()),
        momo_provider: form.momo_provider,
        momo_number: form.momo_number.trim(),
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('trainers')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      console.log('Existing trainer:', existing);

      if (existing?.id) {
        const { error } = await supabase
          .from('trainers')
          .update(updateData)
          .eq('id', existing.id);

        if (error) throw error;
        console.log('Trainer profile updated');
      } else {
        const { error } = await supabase.from('trainers').insert({
          ...updateData,
          owner_id: userId,
          is_approved: false,
          is_active: true,
        });

        if (error) throw error;
        console.log('Trainer profile created');
      }

      const { data: refreshed } = await supabase
        .from('trainers')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (refreshed) {
        setTrainer(refreshed);
        setSuccess('✅ Profile saved successfully!');
      }
    } catch (e) {
      console.log('Save error:', e);
      setError(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

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
          My Profile
        </h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
          This appears on the Sankofa Fit app
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: 14,
            color: '#EF4444',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          ❌ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: 'rgba(48,209,88,0.08)',
            border: '1px solid rgba(48,209,88,0.3)',
            borderRadius: 12,
            padding: 14,
            color: '#30D158',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            color: '#F5C842',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Profile Photo
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(139,92,246,0.1)',
              border: '2px solid rgba(139,92,246,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {trainer?.profile_image_url ? (
              <img
                src={trainer.profile_image_url}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span style={{ fontSize: 36 }}>👤</span>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              style={{
                backgroundColor: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 10,
                padding: '10px 20px',
                color: '#8B5CF6',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: uploadingPhoto ? 0.6 : 1,
                display: 'block',
                marginBottom: 8,
              }}
            >
              {uploadingPhoto ? '⏳ Uploading...' : '📷 Upload Photo'}
            </button>
            <p style={{ color: '#6B7B99', fontSize: 11 }}>
              JPG or PNG · Max 5MB · Square photo works best
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: '#F5C842',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Basic Information
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Kofi Mensah"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="0551234567"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Speciality</label>
              <select
                value={form.speciality}
                onChange={(e) =>
                  setForm((p) => ({ ...p, speciality: e.target.value }))
                }
                style={{ ...inputStyle, appearance: 'none' }}
              >
                {SPECIALITIES.map((s) => (
                  <option
                    key={s}
                    value={s}
                    style={{ backgroundColor: '#0D1B45' }}
                  >
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <select
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
                style={{ ...inputStyle, appearance: 'none' }}
              >
                {CITIES.map((c) => (
                  <option
                    key={c}
                    value={c}
                    style={{ backgroundColor: '#0D1B45' }}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <input
                type="number"
                value={form.experience_years}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    experience_years: e.target.value,
                  }))
                }
                placeholder="e.g. 5"
                min={0}
                max={50}
                style={inputStyle}
              />
              <div
                style={{
                  color: '#6B7B99',
                  fontSize: 11,
                  marginTop: 6,
                }}
              >
                How many years have you been training clients?
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) =>
                setForm((p) => ({ ...p, bio: e.target.value }))
              }
              placeholder="Tell clients about yourself, your training style and approach..."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                color: '#F5C842',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Certifications
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  certifications: [...p.certifications, ''],
                }))
              }
              style={{
                backgroundColor: 'rgba(245,200,66,0.1)',
                border: '1px solid rgba(245,200,66,0.3)',
                borderRadius: 8,
                padding: '5px 12px',
                color: '#F5C842',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Add
            </button>
          </div>

          {form.certifications.map((cert, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <input
                value={cert}
                onChange={(e) => {
                  const updated = [...form.certifications];
                  updated[i] = e.target.value;
                  setForm((p) => ({ ...p, certifications: updated }));
                }}
                placeholder="e.g. ACE Certified Personal Trainer"
                style={{ ...inputStyle, flex: 1 }}
              />
              {form.certifications.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      certifications: p.certifications.filter(
                        (_, fi) => fi !== i,
                      ),
                    }))
                  }
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#EF4444',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              color: '#F5C842',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Payout Details
          </div>
          <p
            style={{
              color: '#6B7B99',
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            Your earnings (85%) will be sent to this MoMo number after payouts
            are processed.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle}>MoMo Provider</label>
              <select
                value={form.momo_provider}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    momo_provider: e.target.value,
                  }))
                }
                style={{ ...inputStyle, appearance: 'none' }}
              >
                {['MTN', 'Vodafone', 'AirtelTigo'].map((p) => (
                  <option
                    key={p}
                    value={p}
                    style={{ backgroundColor: '#0D1B45' }}
                  >
                    {p} MoMo
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mobile Money Number</label>
              <input
                value={form.momo_number}
                onChange={(e) =>
                  setForm((p) => ({ ...p, momo_number: e.target.value }))
                }
                placeholder="0551234567"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
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
          {saving ? '⏳ Saving...' : '💾 Save Profile'}
        </button>
      </form>
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
