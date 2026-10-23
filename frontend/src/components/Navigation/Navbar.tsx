import React from 'react';
import { translations } from '../../services/i18n';

export type AppMode = 'chat' | 'voice' | 'games' | 'study' | 'memories' | 'ai-settings';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  persona: string;
  onPersonaChange: (persona: string) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  isHighContrast?: boolean;
  onContrastToggle?: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  user?: any;
  onOpenAuth: () => void;
  onLogout: () => void;
  userMood?: string;
  onOpenSettings?: () => void;
  onOpenAiSettings?: () => void;
  onOpenDevPanel?: () => void;
  companionName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode: _currentMode,
  onSelectMode,
  language,
  onLanguageChange,
  persona,
  onPersonaChange,
  theme,
  onThemeToggle,
  isHighContrast = false,
  onContrastToggle,
  isMuted,
  onMuteToggle,
  user,
  onOpenAuth,
  onLogout,
  userMood = 'neutral',
  onOpenSettings,
  onOpenAiSettings: _onOpenAiSettings,
  onOpenDevPanel,
  companionName = 'AI Friend',
}) => {
  // UI chrome is strictly English per design requirements
  const t = translations.en;
  const isTamil = language === 'ta';

  const languages = [
    { code: 'en', name: 'AI Voice: English' },
    { code: 'ta', name: 'AI Voice: தமிழ் (Tamil)' },
  ];

  const personas = [
    { id: 'friendly_companion', name: 'Friendly Pal ☀️' },
    { id: 'calm_confidant', name: 'Calm Confidant 🌊' },
    { id: 'study_coach', name: 'Study Coach 📚' },
    { id: 'playful_gamer', name: 'Playful Gamer 🎮' },
  ];

  return (
    <header
      className="glass-panel app-header-navbar"
      style={{
        margin: '6px 16px 2px',
        padding: '8px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderRadius: '20px',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Brand & Companion Emblem with Custom Companion Name */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => onSelectMode('chat')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSelectMode('chat');
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--pastel-lavender-accent), var(--pastel-sky-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.35rem',
            boxShadow: '0 4px 14px rgba(157, 141, 241, 0.35)',
            transition: 'transform 200ms ease',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AI Companion Logo">
            <circle cx="16" cy="16" r="13" fill="#FFF9F0" />
            <ellipse cx="11" cy="18" rx="2.5" ry="1.2" fill="#FA9F7A" fillOpacity="0.6" />
            <ellipse cx="21" cy="18" rx="2.5" ry="1.2" fill="#FA9F7A" fillOpacity="0.6" />
            <circle cx="12" cy="14" r="1.8" fill="#4A3225" />
            <circle cx="20" cy="14" r="1.8" fill="#4A3225" />
            <circle cx="11.5" cy="13.3" r="0.6" fill="#FFFFFF" />
            <circle cx="19.5" cy="13.3" r="0.6" fill="#FFFFFF" />
            <path d="M 10 11 Q 12 10.2 14 11" stroke="#6B4A38" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M 18 11 Q 20 10.2 22 11" stroke="#6B4A38" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M 13 18.5 Q 16 21.5 19 18.5" stroke="#4A3225" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-display)',
            }}
          >
            {companionName || 'AI Friend'}
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--current-emotion-color)',
                background: 'var(--current-emotion-soft)',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Pastel
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {isTamil ? 'உணர்வு தோழன்' : 'Multilingual Emotional Companion'}
          </div>
        </div>
      </div>

      {/* Settings & Controls Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {/* Persona Select */}
        <select
          value={persona}
          onChange={(e) => onPersonaChange(e.target.value)}
          style={{
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '7px 10px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Companion Persona"
          aria-label="Companion Persona"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* AI Conversation Language Select */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '7px 10px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="AI Conversation Language"
          aria-label="AI Conversation Language"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>


        {/* Audio Mute Button */}
        <button
          onClick={onMuteToggle}
          className="btn-ghost"
          style={{ padding: '7px 10px', fontSize: '1rem' }}
          title={isMuted ? 'Voice Muted (Click to Unmute)' : 'Voice Audio Enabled'}
          aria-label={isMuted ? 'Unmute companion voice' : 'Mute companion voice'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Quick Theme Toggle */}
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            className="btn-ghost"
            style={{ padding: '7px 10px', fontSize: '1rem' }}
            title={theme === 'dark' ? 'Cycle Theme (Light / Dark / Calm / Playful)' : 'Cycle Theme'}
            aria-label="Cycle theme"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        )}

        {/* High Contrast Mode Toggle (a11y) */}
        {onContrastToggle && (
          <button
            onClick={onContrastToggle}
            className="btn-ghost"
            style={{ padding: '7px 10px', fontSize: '0.8rem', fontWeight: 600 }}
            title={isHighContrast ? 'Standard Contrast (Alt+C)' : 'High Contrast Mode (Alt+C)'}
            aria-pressed={isHighContrast}
            aria-label={`High contrast mode, current mood ${userMood}`}
          >
            {isHighContrast ? '👁️ Standard' : '👁️ Contrast'}
          </button>
        )}


        {/* General App Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="btn-ghost"
            id="navbar-settings-btn"
            style={{ padding: '7px 10px', fontSize: '1rem', cursor: 'pointer' }}
            title="App Settings (Theme, Font, Display)"
            aria-label="Open App Settings"
          >
            ⚙️
          </button>
        )}

        {/* Developer Testing Panel Button */}
        {onOpenDevPanel && (
          <button
            onClick={onOpenDevPanel}
            className="btn-ghost"
            id="dev-lab-open-btn"
            style={{ padding: '6px 10px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', color: '#9D8DF1' }}
            title="Open Developer Testing & Diagnostics Lab"
            aria-label="Open Developer Testing Lab"
          >
            🔬 Dev Lab
          </button>
        )}



        {/* User Profile / Auth Button */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--current-emotion-soft)',
                padding: '5px 12px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
              }}
              title={user.email}
            >
              👤 {user.display_name || user.email?.split('@')[0]}
            </span>
            <button
              onClick={onLogout}
              className="btn-ghost"
              style={{ padding: '5px 8px', fontSize: '0.78rem', color: '#f87171' }}
              title="Sign Out"
            >
              {t.logout}
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-primary"
            style={{
              padding: '7px 16px',
              fontSize: '0.82rem',
              borderRadius: '14px',
              marginLeft: '4px',
            }}
          >
            {t.signIn}
          </button>
        )}
      </div>
    </header>
  );
};
