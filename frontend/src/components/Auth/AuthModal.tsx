import React, { useState } from 'react';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  language: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language = 'en',
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!isOpen) return null;

  const isTamil = language === 'ta';

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
      } else {
        if (!displayName.trim()) {
          setError(isTamil ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்' : 'Please enter your name');
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          setError(isTamil ? 'கடவுச்சொல் குறைந்தபட்சம் 8 எழுத்துக்கள் இருக்க வேண்டும்' : 'Password must be at least 8 characters long');
          setIsLoading(false);
          return;
        }

        const res = await api.register(email.trim(), password, displayName.trim(), language);
        if (res.verification_required) {
          setSuccessNotice(
            isTamil
              ? '✉️ உங்கள் மின்னஞ்சலுக்கு சரிபார்ப்பு இணைப்பு அனுப்பப்பட்டுள்ளது. தொடர தயவுசெய்து உங்கள் கணக்கை சரிபார்க்கவும்.'
              : "✉️ We've sent a verification link to your email. Please verify your account to continue."
          );
        } else {
          onSuccess(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      const displayMsg =
        typeof err?.message === 'string'
          ? err.message
          : typeof err?.detail === 'string'
          ? err.detail
          : isTamil
          ? 'உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
          : 'Authentication failed. Please check your credentials.';
      setError(displayMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError(isTamil ? 'தயவுசெய்து உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்' : 'Please enter your email address');
      return;
    }
    setIsResending(true);
    setError(null);
    try {
      const res = await api.resendVerification(email.trim());
      setSuccessNotice(res.message);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '30px',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid var(--border-visible)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-amber-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 12px auto',
              boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)',
            }}
          >
            🤖
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0' }}>
            {tab === 'login'
              ? (isTamil ? 'மீண்டும் வருக!' : 'Welcome Back!')
              : (isTamil ? 'புதிய கணக்கை உருவாக்கவும்' : 'Join AI Friend')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            {tab === 'login'
              ? (isTamil ? 'உங்கள் AI தோழருடன் தொடர்ந்து உரையாடுங்கள்' : 'Sign in to sync your conversations & memory vault')
              : (isTamil ? 'உங்களை எப்போதும் ஆதரிக்கும் உணர்வு தோழன்' : 'Your warm, multilingual AI emotional companion')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: '10px',
            padding: '3px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'login' ? 'var(--color-primary-500)' : 'transparent',
              color: tab === 'login' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isTamil ? 'உள்நுழைவு (Login)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'signup' ? 'var(--color-primary-500)' : 'transparent',
              color: tab === 'signup' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isTamil ? 'பதிவுசெய்க (Sign Up)' : 'Sign Up'}
          </button>
        </div>

        {/* Success Notice / Verification Alert */}
        {successNotice && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(20, 184, 166, 0.15)',
              border: '1px solid var(--color-primary-500)',
              borderRadius: '10px',
              color: '#5eead4',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            <div>{successNotice}</div>
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  textDecoration: 'underline',
                  fontSize: '0.8rem',
                  cursor: isResending ? 'not-allowed' : 'pointer',
                  padding: 0,
                }}
              >
                {isResending
                  ? (isTamil ? 'அனுப்புகிறது...' : 'Sending...')
                  : (isTamil ? 'சரிபார்ப்பு இணைப்பை மீண்டும் அனுப்புக' : 'Resend verification link')}
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--safety-crisis-border)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                {isTamil ? 'உங்கள் பெயர்' : 'Display Name'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isTamil ? 'எ.கா. கார்த்திக்' : 'e.g. Alex'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              {isTamil ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isTamil ? 'கடவுச்சொல்' : 'Password'}
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {isTamil ? '(குறைந்தபட்சம் 8 எழுத்துக்கள்)' : '(min. 8 chars)'}
              </span>
            </div>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-amber-500))',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(20, 184, 166, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {isLoading
              ? (isTamil ? 'செயலாக்குகிறது...' : 'Connecting...')
              : tab === 'login'
              ? (isTamil ? 'உள்நுழையவும்' : 'Sign In')
              : (isTamil ? 'கணக்கை தொடங்குக' : 'Create Free Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          🔒 {isTamil ? 'உங்கள் தரவு முற்றிலும் தனிப்பட்டது மற்றும் மறைகுறியாக்கப்பட்டது' : 'Your emotional data is protected with end-to-end security'}
        </div>
      </div>
    </div>
  );
};
