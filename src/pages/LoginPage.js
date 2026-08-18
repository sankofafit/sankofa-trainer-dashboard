import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RiUserHeartLine, RiArrowRightLine } from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

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

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Accra');
  const [speciality, setSpeciality] = useState('Personal Training');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!name.trim()) {
        throw new Error('Please enter your full name');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('Account creation failed');
      }

      console.log('New trainer ID:', userId);

      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .insert({
          name: name.trim(),
          owner_id: userId,
          email,
          phone,
          city: city || 'Accra',
          speciality: speciality || 'Personal Training',
          is_approved: false,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (trainerError) throw trainerError;

      console.log('Trainer created:', trainerData);

      setSuccess(
        'Registration successful! Your profile is under review. Admin will approve it within 24 hours.',
      );
      alert(
        '✅ Registration successful!\n\n' +
          'Your profile is under review. ' +
          'Admin will approve it within 24 hours.',
      );
    } catch (err) {
      console.log('Register error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (isSignUp) {
      handleRegister(e);
    } else {
      handleLogin(e);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080C1C',
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(139,92,246,0.15) 0%, transparent 60%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img
          src="/logo.png"
          alt="Sankofa Fit"
          style={{
            height: 80,
            width: 'auto',
            maxWidth: 220,
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto 24px',
          }}
        />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 24,
          padding: '32px 28px',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 900,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {isSignUp ? '💪 Join as a Trainer' : '👋 Welcome Back'}
        </h2>
        <p
          style={{
            color: '#6B7B99',
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {isSignUp
            ? 'Register as a certified trainer on Sankofa Fit and start earning'
            : 'Sign in to manage your sessions and clients'}
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '12px 14px',
              color: '#EF4444',
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.5,
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
              padding: '12px 14px',
              color: '#30D158',
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kofi Mensah"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0551234567"
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label style={labelStyle}>City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none' }}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Speciality</label>
                  <select
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none' }}
                  >
                    {SPECIALITIES.map((s) => (
                      <option key={s} value={s} style={{ backgroundColor: '#0D1B45' }}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? 'rgba(139,92,246,0.5)' : '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              padding: '15px',
              fontSize: 15,
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              '⏳ Please wait...'
            ) : (
              <>
                {isSignUp ? '🚀 Register as Trainer' : 'Sign In'}
                <RiArrowRightLine size={18} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            color: '#6B7B99',
            fontSize: 13,
          }}
        >
          {isSignUp ? 'Already registered? ' : "Don't have an account? "}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && setIsSignUp(!isSignUp)}
            role="button"
            tabIndex={0}
            style={{
              color: '#8B5CF6',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {isSignUp ? 'Sign In' : 'Register as trainer'}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 28,
          maxWidth: 600,
          width: '100%',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          {
            Icon: MdFitnessCenter,
            title: 'Manage Sessions',
            desc: 'Set your own prices',
            color: '#F5C842',
          },
          {
            Icon: RiUserHeartLine,
            title: 'Get Clients',
            desc: 'Reach users in Ghana',
            color: '#8B5CF6',
          },
          {
            Icon: RiArrowRightLine,
            title: 'Keep 85%',
            desc: 'Of every session fee',
            color: '#30D158',
          },
        ].map((benefit, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              backgroundColor: 'rgba(27,47,107,0.3)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              flex: '1 1 140px',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${benefit.color}15`,
                border: `1px solid ${benefit.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <benefit.Icon size={18} color={benefit.color} />
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {benefit.title}
              </div>
              <div style={{ color: '#6B7B99', fontSize: 11 }}>{benefit.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          color: 'rgba(255,255,255,0.2)',
          fontSize: 12,
          marginTop: 24,
          textAlign: 'center',
        }}
      >
        © 2026 Sankofa Fit · Trainer Portal · Commission: 15% per session
      </p>
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
  padding: '12px 14px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
