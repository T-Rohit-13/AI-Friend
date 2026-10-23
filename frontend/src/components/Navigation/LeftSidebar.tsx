import React, { useState, useEffect } from 'react';
import type { AppMode } from './Navbar';
import { getAvatarPreferences, saveAvatarPreferences } from '../../services/avatarPreferences';

interface LeftSidebarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  currentMood: string;
  moodLabel?: string;
  onOpenMoodSelector?: () => void;
  onOpenSettings: () => void;
  onOpenAiSettings: () => void;
  onOpenMoodHistory: () => void;
  companionName?: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentMode,
  onSelectMode,
  language,
  onLanguageChange,
  currentMood = 'happy',
  moodLabel = 'Happy & Energetic',
  onOpenMoodSelector,
  onOpenSettings,
  onOpenAiSettings,
  onOpenMoodHistory,
  companionName = 'AI-Friend',
}) => {
  const [prefs, setPrefs] = useState(() => getAvatarPreferences());

  useEffect(() => {
    const handlePrefChange = (e: any) => {
      if (e.detail) setPrefs(e.detail);
    };
    window.addEventListener('ai_friend_avatar_prefs_changed', handlePrefChange);
    return () => window.removeEventListener('ai_friend_avatar_prefs_changed', handlePrefChange);
  }, []);

  const navItems = [
    { id: 'chat' as AppMode, label: 'Chat', icon: '💬' },
    { id: 'voice' as AppMode, label: 'Voice Call', icon: '🎙️' },
    { id: 'games' as AppMode, label: 'Riddles & Games', icon: '🎮' },
    { id: 'study' as AppMode, label: 'Study Coach', icon: '📚' },
    { id: 'memories' as AppMode, label: 'Memory Vault', icon: '🧠' },
  ];

  // Dynamic mood quote based on active mood
  const moodQuotes: Record<string, string> = {
    happy: "You're doing great! ☀️",
    calm: "Peaceful & centered 🌿",
    sad: "Here for you always 💜",
    stressed: "Take a deep breath 🌸",
    excited: "Ready for adventure! 🚀",
    neutral: "Balanced & mindful ✨",
  };

  const currentQuote = moodQuotes[currentMood.toLowerCase()] || "You're doing great! ☀️";

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const updated = saveAvatarPreferences({ voiceId: val });
    setPrefs(updated);
  };

  return (
    <aside
      className="glass-panel left-sidebar-nav"
      style={{
        width: '230px',
        margin: 0,
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: '24px',
        padding: '12px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: '8px',
        overflowY: 'auto',
        flexShrink: 0,
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 28px var(--shadow-sm)',
        zIndex: 40,
      }}
    >
      {/* Top Branding */}
      <div>
        <div
          onClick={() => onSelectMode('chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '2px 6px 10px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--current-pastel-gradient, linear-gradient(135deg, #93c5fd, #c4b5fd))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              color: '#ffffff',
              boxShadow: '0 4px 10px var(--current-emotion-glow)',
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {companionName || 'AI-Friend'}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const active = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: active ? 'linear-gradient(135deg, #ede9fe, #e0e7ff)' : 'transparent',
                  color: active ? '#4f46e5' : '#64748b',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 160ms ease',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Chat History Grouped by Mood */}
          <button
            onClick={onOpenMoodHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 12px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              color: '#7c3aed',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 160ms ease',
              marginTop: '2px',
            }}
            title="View conversations grouped by emotional state"
          >
            <span style={{ fontSize: '1rem' }}>🕒</span>
            <span>Mood History</span>
          </button>
        </nav>
      </div>

      {/* Bottom Controls (Current Mood Card, Language, Voice, Settings) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
        {/* Dynamic Current Mood Widget Card */}
        <div
          onClick={onOpenMoodSelector}
          id="sidebar-mood-card"
          style={{
            background: 'var(--current-emotion-soft)',
            border: '1px solid var(--current-emotion-color)',
            borderRadius: '14px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: onOpenMoodSelector ? 'pointer' : 'default',
            boxShadow: '0 4px 14px var(--current-emotion-glow)',
            transition: 'all 300ms ease',
          }}
          title="Click to view or test mood tone coloring"
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            {currentMood === 'happy'
              ? '☀️'
              : currentMood === 'calm'
              ? '🌿'
              : currentMood === 'sad'
              ? '💜'
              : currentMood === 'angry' || currentMood === 'frustrated'
              ? '⚡'
              : currentMood === 'anxious'
              ? '😰'
              : currentMood === 'excited' || currentMood === 'surprised'
              ? '🌟'
              : '⚪'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--current-emotion-color)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Current Mood
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {moodLabel} ▾
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {currentQuote}
            </div>
          </div>
        </div>

        {/* Language Dropdown */}
        <div>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '3px', display: 'block', paddingLeft: '4px' }}>
            Language
          </label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>
        </div>

        {/* Voice Dropdown */}
        <div>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '3px', display: 'block', paddingLeft: '4px' }}>
            Voice
          </label>
          <select
            value={prefs.voiceId || (prefs.gender === 'male' ? 'en-US-GuyNeural' : 'en-US-JennyNeural')}
            onChange={handleVoiceChange}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="en-US-JennyNeural">Female (Jenny)</option>
            <option value="en-US-GuyNeural">Male (Guy)</option>
            <option value="ta-IN-PallaviNeural">Tamil (Pallavi)</option>
            <option value="ta-IN-ValluvarNeural">Tamil (Valluvar)</option>
          </select>
        </div>

        {/* Settings & AI Settings Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '6px' }}>
          <button
            onClick={onOpenSettings}
            id="sidebar-settings-btn"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            title="App Settings (Themes, Display & Accessibility)"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>

          <button
            onClick={onOpenAiSettings}
            id="sidebar-ai-settings-btn"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.25), rgba(196, 181, 253, 0.35))',
              color: 'var(--current-emotion-color, #6366f1)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px var(--current-emotion-glow)',
              transition: 'all 150ms ease',
            }}
            title="AI Companion & 3D Avatar Settings"
          >
            <span>✨</span>
            <span>AI Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
