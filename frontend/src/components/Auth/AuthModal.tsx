import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  language: string;
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language = 'en',
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isTamil = language === 'ta' || language.startsWith('ta');

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const res = await api.login(email.trim(), password);
        onSuccess(res.user);
        onClose();
      } else if (tab === 'signup') {
        if (!displayName.trim()) {
          setError(isTamil ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்' : 'Please enter your full name');
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          setError(
            isTamil
              ? 'கடவுச்சொல் குறைந்தபட்சம் 8 எழுத்துக்கள் இருக்க வேண்டும்'
              : 'Password must be at least 8 characters long'
          );
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError(isTamil ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'Passwords do not match');
          setIsLoading(false);
          return;
        }

        // Phone number normalization and differentiation check
        const normUser = normalizePhone(phoneNumber);
        const normParent = normalizePhone(parentPhoneNumber);
        if (normUser && normParent && normUser === normParent) {
          setError(
            isTamil
              ? 'பயனரின் மொபைல் எண்ணும் பெற்றோர் மொபைல் எண்ணும் வெவ்வேறாக இருக்க வேண்டும்'
              : "User's mobile number and parent/guardian mobile number must differ."
          );
          setIsLoading(false);
          return;
        }

        const res = await api.register(
          email.trim(),
          password,
          displayName.trim(),
          language,
          confirmPassword,
          phoneNumber.trim(),
          parentPhoneNumber.trim()
        );

        if (res.verification_required) {
          setTab('otp');
          setCooldown(60);
          setSuccessNotice(
            isTamil
              ? '✉️ உங்கள் மின்னஞ்சலுக்கு 6-இலக்க OTP குறியீடு அனுப்பப்பட்டுள்ளது.'
              : "✉️ We've sent a 6-digit verification code to your email."
          );
        } else {
          onSuccess(res.user);
          onClose();
        }
      } else if (tab === 'otp') {
        if (otpCode.trim().length < 6) {
          setError(
            isTamil ? 'தயவுசெய்து 6-இலக்க OTP குறியீட்டை உள்ளிடவும்' : 'Please enter the 6-digit verification code'
          );
          setIsLoading(false);
          return;
        }
        const res = await api.verifyOtp(email.trim(), otpCode.trim());
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.resendOtp(email.trim());
      setSuccessNotice(res.message);
      setCooldown(60);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(20, 16, 36, 0.55)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 200ms ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(216, 208, 252, 0.8)',
          boxShadow: '0 20px 60px rgba(79, 70, 229, 0.16)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(216, 208, 252, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(205, 234, 252, 0.3), rgba(216, 208, 252, 0.3))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🌸</span>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#312e81' }}>
              {tab === 'otp'
                ? isTamil
                  ? 'மின்னஞ்சல் சரிபார்ப்பு'
                  : 'Verify Your Email'
                : tab === 'signup'
                ? isTamil
                  ? 'கணக்கு தொடங்கு'
                  : 'Create an Account'
                : isTamil
                ? 'உள்நுழைக'
                : 'Welcome Back'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher (Login vs Signup) */}
        {tab !== 'otp' && (
          <div style={{ display: 'flex', padding: '12px 24px 0' }}>
            <div
              style={{
                display: 'flex',
                width: '100%',
                background: 'rgba(244, 240, 253, 0.8)',
                padding: '4px',
                borderRadius: '14px',
                border: '1px solid rgba(216, 208, 252, 0.8)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setSuccessNotice(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: tab === 'login' ? '#ffffff' : 'transparent',
                  color: tab === 'login' ? '#4f46e5' : '#6b7280',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: tab === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {isTamil ? 'உள்நுழைவு' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setError(null);
                  setSuccessNotice(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: tab === 'signup' ? '#ffffff' : 'transparent',
                  color: tab === 'signup' ? '#4f46e5' : '#6b7280',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: tab === 'signup' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {isTamil ? 'பதிவு செய்க' : 'Sign Up'}
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#b91c1c',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {successNotice && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid #10b981',
                color: '#065f46',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              {successNotice}
            </div>
          )}

          {/* OTP Verification Tab */}
          {tab === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.5 }}>
                Enter the 6-digit code sent to <strong>{email}</strong>:
              </div>

              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                style={{
                  letterSpacing: '10px',
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  padding: '12px',
                  borderRadius: '16px',
                  border: '2px solid #818cf8',
                  background: '#f8fafc',
                  outline: 'none',
                  color: '#4f46e5',
                }}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.82rem' }}>
                <span style={{ color: '#6b7280' }}>Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cooldown > 0 ? '#9ca3af' : '#4f46e5',
                    fontWeight: 700,
                    cursor: cooldown > 0 ? 'default' : 'pointer',
                  }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {/* Login or Signup Inputs */}
          {tab !== 'otp' && (
            <>
              {tab === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Rohit Sharma"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {tab === 'signup' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                      Your Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                      Parent/Guardian Mobile
                    </label>
                    <input
                      type="tel"
                      value={parentPhoneNumber}
                      onChange={(e) => setParentPhoneNumber(e.target.value)}
                      placeholder="+91 9123456789"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {tab === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '14px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                }}
              >
                {isLoading
                  ? 'Processing...'
                  : tab === 'signup'
                  ? 'Create Account & Send OTP'
                  : 'Log In to AI Friend'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
