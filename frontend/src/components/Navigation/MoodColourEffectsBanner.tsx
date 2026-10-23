import React, { useState } from 'react';
import { getThemeEngine } from '../../services/themeEngine';

interface MoodColourEffectsBannerProps {
  activeMood: string;
  onSelectMood?: (mood: string) => void;
}

export const MoodColourEffectsBanner: React.FC<MoodColourEffectsBannerProps> = ({
  activeMood = 'happy',
  onSelectMood,
}) => {
  const themeEngine = getThemeEngine();
  const [isExpanded, setIsExpanded] = useState(true);

  const moodThemes = [
    {
      id: 'happy',
      label: 'Happy & Energetic',
      icon: '☀️',
      desc: 'Warm yellows & soft peach for positivity.',
      bg: 'linear-gradient(135deg, rgba(254, 240, 138, 0.35), rgba(253, 186, 116, 0.3))',
      border: '#fbbf24',
      badgeBg: 'rgba(254, 243, 199, 0.9)',
      color: '#b45309',
    },
    {
      id: 'calm',
      label: 'Calm & Focused',
      icon: '🌿',
      desc: 'Soft blues & mint for serenity and peace.',
      bg: 'linear-gradient(135deg, rgba(187, 247, 208, 0.35), rgba(186, 230, 253, 0.3))',
      border: '#34d399',
      badgeBg: 'rgba(209, 250, 229, 0.9)',
      color: '#047857',
    },
    {
      id: 'sad',
      label: 'Sad & Low',
      icon: '💜',
      desc: 'Cool purples & gentle blues for comfort.',
      bg: 'linear-gradient(135deg, rgba(221, 214, 254, 0.4), rgba(199, 210, 254, 0.3))',
      border: '#a78bfa',
      badgeBg: 'rgba(237, 233, 254, 0.9)',
      color: '#6d28d9',
    },
    {
      id: 'angry',
      label: 'Stressed & Agitated',
      icon: '⚡',
      desc: 'Soft rose & amber for emotional balance.',
      bg: 'linear-gradient(135deg, rgba(254, 205, 211, 0.4), rgba(254, 215, 170, 0.3))',
      border: '#f87171',
      badgeBg: 'rgba(254, 226, 226, 0.9)',
      color: '#b91c1c',
    },
    {
      id: 'excited',
      label: 'Excited & Playful',
      icon: '🌟',
      desc: 'Bright golden amber for high motivation.',
      bg: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(253, 164, 175, 0.35))',
      border: '#f59e0b',
      badgeBg: 'rgba(254, 243, 199, 0.9)',
      color: '#b45309',
    },
    {
      id: 'neutral',
      label: 'Neutral & Balanced',
      icon: '⚪',
      desc: 'Gentle pastel azure for equilibrium.',
      bg: 'linear-gradient(135deg, rgba(243, 244, 246, 0.5), rgba(219, 234, 254, 0.4))',
      border: '#94a3b8',
      badgeBg: 'rgba(241, 245, 249, 0.9)',
      color: '#475569',
    },
  ];

  const handleMoodClick = (moodId: string) => {
    if (activeMood === moodId) {
      themeEngine.setManualMoodOverride(null);
    } else {
      themeEngine.setManualMoodOverride(moodId as any);
    }
    if (onSelectMood) onSelectMood(moodId);
  };

  return (
    <div
      className="glass-panel"
      id="mood-colour-effects-bar"
      style={{
        margin: '6px 16px 10px',
        padding: isExpanded ? '10px 18px 12px' : '8px 16px',
        borderRadius: '20px',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 250ms ease',
        flexShrink: 0,
      }}
    >
      {/* Title & Description & Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: isExpanded ? '10px' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem' }}>🎨</span>
          <div>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Mood-Based Colour Atmosphere</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--current-emotion-soft)',
                  color: 'var(--current-emotion-color)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Active: {activeMood.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Shifts dynamically based on your tone
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={isExpanded ? 'Collapse mood bar' : 'Expand mood bar'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? '▲ Hide' : '▼ Show Palette'}
          </button>
        </div>
      </div>

      {/* 6 Mood Cards */}
      {isExpanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '8px',
          }}
        >
          {moodThemes.map((item) => {
            const isSelected =
              activeMood.toLowerCase() === item.id ||
              (item.id === 'angry' && activeMood.toLowerCase() === 'frustrated');
            return (
              <div
                key={item.id}
                onClick={() => handleMoodClick(item.id)}
                id={`mood-palette-chip-${item.id}`}
                style={{
                  background: item.bg,
                  border: `1.5px solid ${isSelected ? item.border : 'var(--border-subtle)'}`,
                  borderRadius: '12px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 200ms ease',
                  transform: isSelected ? 'scale(1.02)' : 'none',
                  boxShadow: isSelected
                    ? `0 4px 14px ${item.border}44, 0 0 0 2px ${item.border}`
                    : 'none',
                }}
                title={`Click to preview ${item.label} atmosphere`}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: item.badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{item.label}</span>
                    {isSelected && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                  </div>
                  <div
                    style={{
                      fontSize: '0.66rem',
                      color: 'var(--text-muted)',
                      marginTop: '1px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
