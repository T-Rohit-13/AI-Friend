import React, { useState, useEffect, useRef } from 'react';
import type { ThemeEngineState, EmotionLabel, UserTheme } from '../../services/themeEngine';
import { getThemeEngine } from '../../services/themeEngine';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

const EMOTION_OPTIONS: { value: EmotionLabel; label: string; icon: string }[] = [
  { value: 'neutral', label: 'Neutral', icon: '😐' },
  { value: 'happy', label: 'Happy', icon: '😊' },
  { value: 'sad', label: 'Sad', icon: '😢' },
  { value: 'angry', label: 'Frustrated', icon: '😤' },
  { value: 'anxious', label: 'Anxious', icon: '😰' },
  { value: 'calm', label: 'Calm', icon: '😌' },
  { value: 'surprised', label: 'Surprised', icon: '😮' },
  { value: 'frustrated', label: 'Irritated', icon: '😣' },
];

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
  const isTamil = language === 'ta';

  useEffect(() => {
    const unsub = engine.subscribe(setState);
    return unsub;
  }, []);

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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
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
        aria-label={isTamil ? 'அமைப்புகள்' : 'Settings & Appearance'}
        tabIndex={-1}
        id="settings-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '420px',
          height: '100vh',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)',
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
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem',
                fontWeight: 700,
                margin: 0,
              }}
            >
              ⚙️ {isTamil ? 'அமைப்புகள்' : 'Settings & Appearance'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isTamil ? 'உங்கள் அனுபவத்தை தனிப்பயனாக்குங்கள்' : 'Customize your companion experience'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ fontSize: '1.2rem', padding: '6px 10px' }}
            aria-label="Close settings"
            id="settings-close-btn"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* ─── Section 1: Theme Selection ─── */}
          <section>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎨 {isTamil ? 'தீம் தேர்வு' : 'Visual Theme'}
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
                      padding: '14px 12px',
                      borderRadius: '14px',
                      border: isActive
                        ? '2px solid var(--current-emotion-color)'
                        : '1px solid var(--border-subtle)',
                      background: isActive
                        ? 'rgba(45, 212, 191, 0.1)'
                        : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 200ms ease',
                      color: 'var(--text-primary)',
                      boxShadow: isActive ? '0 0 16px var(--current-emotion-glow)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{opt.label}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── Section 2: Mood Adaptation Toggle ─── */}
          <section>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧠 {isTamil ? 'மனநிலை சார்ந்த UI' : 'Mood-Based UI Adaptation'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              {isTamil
                ? 'இயக்கினால், AI Friend உங்கள் குரல் தொனியின் அடிப்படையில் நிறங்கள் மற்றும் இயக்கங்களை நுட்பமாக மாற்றும். இது ஒரு வடிவமைப்பு அம்சமே, சிகிச்சை அல்ல.'
                : 'When enabled, AI Friend subtly adapts colours and animations based on vocal tone inference. This is a design feature, not therapy. Colour changes do not claim to improve your mood.'}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  {isTamil ? 'உணர்ச்சி சார்ந்த தீம்' : 'Adaptive mood theming'}
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {state.moodAdaptationEnabled ? '✅ Enabled' : '⬜ Disabled'}
                </div>
              </div>
              <button
                onClick={() => engine.setMoodAdaptationEnabled(!state.moodAdaptationEnabled)}
                id="mood-adaptation-toggle"
                role="switch"
                aria-checked={state.moodAdaptationEnabled}
                aria-label="Toggle mood-based UI adaptation"
                style={{
                  width: '52px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  background: state.moodAdaptationEnabled
                    ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))'
                    : 'rgba(255, 255, 255, 0.15)',
                  transition: 'background 200ms ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: state.moodAdaptationEnabled ? '26px' : '3px',
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
          </section>

          {/* ─── Section 3: Manual Mood Override ─── */}
          <section>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎭 {isTamil ? 'உங்கள் மனநிலையை தேர்ந்தெடுக்கவும்' : 'How Are You Feeling?'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              {isTamil
                ? 'நீங்கள் எப்படி உணருகிறீர்கள் என்பதை நீங்களே தேர்ந்தெடுக்கலாம். இது AI ஊகத்தை மேலெழுதும்.'
                : 'You can tell us how you\'re feeling. This overrides any AI inference. Select "Neutral" to clear.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EMOTION_OPTIONS.map((opt) => {
                const isActive = state.manualMoodOverride === opt.value;
                const tokens = engine.getTokensForEmotion(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (isActive || (opt.value === 'neutral' && state.manualMoodOverride === null)) {
                        engine.setManualMoodOverride(null);
                      } else {
                        engine.setManualMoodOverride(opt.value);
                      }
                    }}
                    id={`mood-btn-${opt.value}`}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: isActive
                        ? `2px solid ${tokens.emotionColor}`
                        : '1px solid var(--border-subtle)',
                      background: isActive
                        ? `${tokens.emotionColor}22`
                        : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? tokens.emotionColor : 'var(--text-secondary)',
                      transition: 'all 200ms ease',
                      boxShadow: isActive ? `0 0 12px ${tokens.emotionGlow}` : 'none',
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {state.manualMoodOverride && (
              <button
                onClick={() => engine.setManualMoodOverride(null)}
                className="btn-ghost"
                id="clear-mood-override"
                style={{
                  marginTop: '10px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                }}
              >
                {isTamil ? 'கைமுறை மேலெழுதலை அழிக்கவும்' : 'Clear manual override (use AI inference)'}
              </button>
            )}
          </section>

          {/* ─── Section 4: Current State Info ─── */}
          <section>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 {isTamil ? 'தற்போதைய நிலை' : 'Current Mood State'}
            </h3>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active mood:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: state.activeTokens.emotionColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: state.activeTokens.emotionColor,
                      boxShadow: `0 0 8px ${state.activeTokens.emotionColor}`,
                      display: 'inline-block',
                    }}
                  />
                  {state.activeTokens.label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Source:</span>
                <span style={{ fontWeight: 600 }}>
                  {state.manualMoodOverride
                    ? '🎭 Manual override'
                    : state.moodAdaptationEnabled
                    ? '🎙️ Voice inference'
                    : '⬜ Adaptation disabled'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Emotion model:</span>
                <span style={{ fontWeight: 600, color: state.modelAvailable ? '#34d399' : '#f87171' }}>
                  {state.modelAvailable ? '🟢 Available' : '🔴 Unavailable'}
                </span>
              </div>
              {state.lastRawPrediction && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last raw prediction:</span>
                  <span style={{ fontWeight: 600 }}>
                    {state.lastRawPrediction.primary_emotion} ({(state.lastRawPrediction.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ─── Section 5: Accessibility ─── */}
          <section>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ♿ {isTamil ? 'அணுகல் எளிமை' : 'Accessibility'}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
              {isTamil
                ? 'இயக்கத்தை குறைக்க உங்கள் OS அமைப்புகளில் "Reduce Motion" ஐ இயக்கவும்.'
                : 'To reduce animations, enable "Reduce Motion" in your OS accessibility settings. All themes meet WCAG 2.1 AA contrast.'}
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>⌨️ Keyboard: Alt+1-5 for modes, Alt+C for contrast, Alt+M for mute</span>
              <span>🎨 Colour is never the sole indicator of any status</span>
              <span>🔒 Core navigation is always visible in every mood state</span>
            </div>
          </section>

          {/* ─── Transparency Notice ─── */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(45, 212, 191, 0.08)',
              border: '1px solid rgba(45, 212, 191, 0.2)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--color-primary-400)' }}>🛡️ Transparency:</strong>{' '}
            {isTamil
              ? 'மனநிலை சார்ந்த நிற மாற்றங்கள் வடிவமைப்பு அம்சங்கள். அவை சிகிச்சை அல்ல மற்றும் உங்கள் மனநிலையை மாற்றுவதாக உறுதியளிக்கவில்லை.'
              : 'Mood-based colour changes are design features, not therapy. They do not claim to therapeutically improve your emotional state. Vocal emotion is a tentative signal, not proof of how you feel.'}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    </>
  );
};
