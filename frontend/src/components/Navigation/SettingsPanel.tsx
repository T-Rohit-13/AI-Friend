import React, { useState, useEffect, useRef } from 'react';
import type { ThemeEngineState, UserTheme } from '../../services/themeEngine';
import { getThemeEngine } from '../../services/themeEngine';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}



const THEME_OPTIONS: { value: UserTheme; label: string; icon: string; desc: string }[] = [
  { value: 'light', label: 'Pastel Daylight', icon: '🌸', desc: 'Soft lavender, sky blue & cream' },
  { value: 'dark', label: 'Pastel Nocturne', icon: '🌙', desc: 'Nocturnal soft lavender sanctuary' },
  { value: 'calm', label: 'Pastel Calm', icon: '🌿', desc: 'Soothing mint & gentle transitions' },
  { value: 'playful', label: 'Pastel Sunrise', icon: '🎨', desc: 'Warm peach & lively apricot' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const engine = getThemeEngine();
  const [state, setState] = useState<ThemeEngineState>(engine.getState());
  const panelRef = useRef<HTMLDivElement>(null);
  const isTamil = language === 'ta' || language.startsWith('ta');

  // Necessary App Settings state
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('aifriend_font_size') as any) || 'normal';
  });
  const [soundEffects, setSoundEffects] = useState<boolean>(() => {
    const saved = localStorage.getItem('aifriend_sound_effects');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    const unsub = engine.subscribe(setState);
    return unsub;
  }, []);

  // Sync font size attribute on root
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('aifriend_font_size', fontSize);
  }, [fontSize]);

  // Persist sound effects preference
  const handleSoundToggle = (enabled: boolean) => {
    setSoundEffects(enabled);
    localStorage.setItem('aifriend_sound_effects', String(enabled));
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetSettings = () => {
    engine.setUserTheme('dark');
    engine.setMoodAdaptationEnabled(true);
    engine.setManualMoodOverride(null);
    setFontSize('normal');
    setSoundEffects(true);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          animation: 'fadeIn 200ms ease',
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isTamil ? 'பயன்பாட்டு அமைப்புகள்' : 'App Settings'}
        tabIndex={-1}
        id="settings-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '440px',
          height: '100vh',
          background: 'var(--bg-surface-elevated)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-8px 0 32px rgba(120, 100, 180, 0.25)',
          zIndex: 1000,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 250ms ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: 'var(--bg-surface-elevated)',
            zIndex: 2,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ⚙️ {isTamil ? 'பயன்பாட்டு அமைப்புகள்' : 'App Settings'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isTamil ? 'தீம், தோற்றம் மற்றும் காட்சி விருப்பங்கள்' : 'Theme, color atmosphere & display preferences'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ fontSize: '1.2rem', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
            aria-label="Close settings"
            id="settings-close-btn"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Saved feedback notice */}
          {isSavedNotice && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(99, 216, 165, 0.16)',
                border: '1px solid var(--pastel-mint-deep, #38B57E)',
                color: 'var(--pastel-mint-deep, #38B57E)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>✅</span>
              <span>{isTamil ? 'அமைப்புகள் மீட்டமைக்கப்பட்டன!' : 'App settings reset to defaults!'}</span>
            </div>
          )}

          {/* ─── SECTION 1: THEME SELECTION ─── */}
          <section>
            <h3
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
              }}
            >
              🎨 {isTamil ? 'பயன்பாட்டு தீம்' : 'App Theme'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {THEME_OPTIONS.map((opt) => {
                const isActive = state.userTheme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => engine.setUserTheme(opt.value)}
                    id={`theme-btn-${opt.value}`}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '14px',
                      border: isActive
                        ? '2px solid var(--current-emotion-color)'
                        : '1px solid var(--border-subtle)',
                      background: isActive
                        ? 'var(--current-emotion-soft)'
                        : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 200ms ease',
                      color: 'var(--text-primary)',
                      boxShadow: isActive ? '0 0 16px var(--current-emotion-glow)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{opt.label}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3, textAlign: 'center' }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── SECTION 2: MOOD & TONE ADAPTIVE UI ─── */}
          <section>
            <h3
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
              }}
            >
              🧠 {isTamil ? 'மனநிலை சார்ந்த வண்ண மாற்றம்' : 'Mood Tone UI Color Adaptation'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              {isTamil
                ? 'இயக்கினால், உங்கள் குரல் தொனி மற்றும் உரையாடலின் உணர்வை AI பகுப்பாய்வு செய்து UI வண்ணங்களை தானாகவே மாற்றும்.'
                : 'When enabled, the AI continuously analyzes your voice tone & conversation sentiment to dynamically adapt the UI colors and ambient background in real time.'}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  {isTamil ? 'AI தொனி வண்ண மாற்றம் (தானியங்கி)' : 'AI Tone-Adaptive Coloring (Automated)'}
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {state.moodAdaptationEnabled ? '✅ AI Active (Listening to voice & tone)' : '⬜ Off (Fixed neutral colors)'}
                </div>
              </div>
              <button
                onClick={() => {
                  engine.setMoodAdaptationEnabled(!state.moodAdaptationEnabled);
                  if (state.manualMoodOverride) {
                    engine.setManualMoodOverride(null);
                  }
                }}
                id="mood-adaptation-toggle"
                role="switch"
                aria-checked={state.moodAdaptationEnabled}
                aria-label="Toggle mood-based UI adaptation"
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  background: state.moodAdaptationEnabled
                    ? 'linear-gradient(135deg, var(--current-emotion-color, #6366f1), #818cf8)'
                    : 'rgba(150, 150, 150, 0.3)',
                  transition: 'background 200ms ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: state.moodAdaptationEnabled ? '26px' : '2px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    transition: 'left 200ms ease',
                  }}
                />
              </button>
            </div>

            {/* Live AI Tone Detection Status Card (Read-only, no manual overrides) */}
            <div
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--current-emotion-soft)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--current-emotion-color)',
                    boxShadow: '0 0 10px var(--current-emotion-color)',
                    display: 'inline-block',
                    animation: 'pulseAura 2s infinite ease-in-out',
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isTamil ? 'AI கண்டறிந்த தற்போதைய தொனி:' : 'AI-Detected Tone & Mood:'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--current-emotion-color)', fontWeight: 600 }}>
                    {state.activeTokens.label} {state.lastEmotionSource ? `(${state.lastEmotionSource === 'voice' ? 'Vocal Speech' : 'Chat Sentiment'})` : ''}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                100% AI Driven
              </span>
            </div>
          </section>

          {/* ─── SECTION 4: NECESSARY APP SETTINGS ─── */}
          <section
            style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--bg-surface-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
              }}
            >
              🔧 {isTamil ? 'அத்தியாவசிய அமைப்புகள்' : 'Necessary App Settings'}
            </h3>

            {/* Font Size Scale */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                🔤 {isTamil ? 'எழுத்துரு அளவு (Font Size)' : 'Text Size'}:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: fontSize === sz ? '2px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
                      background: fontSize === sz ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {sz === 'normal' ? 'Standard' : sz === 'large' ? 'Large' : 'Extra Large'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Effects Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  🔔 {isTamil ? 'ஒலி விளைவுகள் (Sound Effects)' : 'Sound Effects'}
                </span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {isTamil ? 'செய்தி மற்றும் குரல் ஒலிகள்' : 'Message & call audio feedback'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => handleSoundToggle(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Reset All App Settings Button */}
            <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={handleResetSettings}
                className="btn-ghost"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                🔄 {isTamil ? 'இயல்புநிலைக்கு மீட்டமை' : 'Reset All to Defaults'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};
