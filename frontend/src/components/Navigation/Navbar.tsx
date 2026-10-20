import React from 'react';

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
}) => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
  ];

  const personas = [
    { id: 'friendly_companion', name: 'Friendly Pal ☀️' },
    { id: 'calm_confidant', name: 'Calm Confidant 🌊' },
    { id: 'study_coach', name: 'Study Coach 📚' },
    { id: 'playful_gamer', name: 'Playful Gamer 🎮' },
  ];

  const modes: { id: AppMode; label: string; icon: string }[] = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'voice', label: 'Voice Call', icon: '🎙️' },
    { id: 'games', label: 'Riddles & Games', icon: '🎮' },
    { id: 'study', label: 'Study Coach', icon: '📚' },
    { id: 'memories', label: 'Memory Vault', icon: '🧠' },
  ];

  return (
    <header
      className="glass-panel"
      style={{
        margin: '14px 16px',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderRadius: '16px',
        zIndex: 50,
      }}
    >
      {/* Brand & Companion Emblem */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onSelectMode('chat')}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-amber-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.35)',
          }}
        >
          🤖
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            AI Friend
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: 'var(--color-primary-400)',
                background: 'rgba(45, 212, 191, 0.15)',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(45, 212, 191, 0.3)',
              }}
            >
              v1.0
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Multilingual Emotional Companion
          </div>
        </div>
      </div>

      {/* Feature Mode Switcher Tabs */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              style={{
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))'
                  : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 200ms ease',
                boxShadow: isActive ? '0 2px 8px rgba(13, 148, 136, 0.35)' : 'none',
              }}
            >
              <span>{m.icon}</span>
              <span className="mode-label">{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings / Controls Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Persona Select */}
        <select
          value={persona}
          onChange={(e) => onPersonaChange(e.target.value)}
          style={{
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '6px 10px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Companion Persona"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Language Select */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '6px 10px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Select Language"
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
          style={{ padding: '6px 10px', fontSize: '1rem' }}
          title={isMuted ? 'Voice Muted (Click to Unmute)' : 'Voice Audio Enabled'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onThemeToggle}
          className="btn-ghost"
          style={{ padding: '6px 10px', fontSize: '1rem' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* High Contrast Mode Toggle (a11y) */}
        {onContrastToggle && (
          <button
            onClick={onContrastToggle}
            className="btn-ghost"
            style={{ padding: '6px 10px', fontSize: '0.85rem', fontWeight: 600 }}
            title={isHighContrast ? 'Disable High Contrast (Alt+C)' : 'Enable WCAG AAA High Contrast (Alt+C)'}
            aria-pressed={isHighContrast}
          >
            {isHighContrast ? '👁️ Standard' : '👁️ Contrast'}
          </button>
        )}
      </div>
    </header>
  );
};
