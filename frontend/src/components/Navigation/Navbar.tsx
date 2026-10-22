import React from 'react';
import { translations } from '../../services/i18n';

export type AppMode = 'chat' | 'voice' | 'games' | 'study' | 'memories';

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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
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

  const modes: { id: AppMode; label: string; icon: string }[] = [
    { id: 'chat', label: t.tabChat, icon: '💬' },
    { id: 'voice', label: t.tabVoice, icon: '🎙️' },
    { id: 'games', label: t.tabGames, icon: '🎮' },
    { id: 'study', label: t.tabStudy, icon: '📚' },
    { id: 'memories', label: t.tabMemories, icon: '🧠' },
  ];


  return (
    <header
      className="glass-panel"
      style={{
        margin: '12px 16px',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderRadius: '22px',
        zIndex: 50,
      }}
    >
      {/* Brand & Companion Emblem */}
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
            width: '42px',
            height: '42px',
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
          🤖
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
            AI Friend
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

      {/* Feature Mode Switcher Tabs */}
      <nav
        aria-label="Navigation Tabs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(157, 141, 241, 0.08)',
          padding: '4px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, var(--current-emotion-color), #7461DE)'
                  : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                padding: '7px 14px',
                borderRadius: '12px',
                fontSize: '0.825rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 200ms ease',
                boxShadow: isActive ? '0 4px 14px var(--current-emotion-glow)' : 'none',
              }}
            >
              <span>{m.icon}</span>
              <span className="mode-label">{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings / Controls Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="btn-ghost"
          id="settings-open-btn"
          style={{ padding: '7px 10px', fontSize: '1rem' }}
          title={isTamil ? 'அமைப்புகள் (Alt+S)' : 'Settings & Appearance (Alt+S)'}
          aria-label="Open settings"
        >
          ⚙️
        </button>

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
