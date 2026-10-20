import React from 'react';

export type CompanionState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface EmotionalAvatarProps {
  emotion: string; // 'neutral' | 'happy' | 'sad' | 'angry' | 'anxious' | 'surprised'
  state: CompanionState;
  personaName?: string;
  size?: number;
}

export const EmotionalAvatar: React.FC<EmotionalAvatarProps> = ({
  emotion = 'neutral',
  state = 'idle',
  personaName = 'AI Friend',
  size = 140,
}) => {
  // Emotion color configurations
  const emotionThemes: Record<string, { color: string; glow: string; label: string }> = {
    neutral: { color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.4)', label: 'Balanced & Present' },
    happy: { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.45)', label: 'Warm & Joyful' },
    sad: { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)', label: 'Compassionate' },
    angry: { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.4)', label: 'Cooling Calm' },
    anxious: { color: '#34d399', glow: 'rgba(52, 211, 153, 0.4)', label: 'Grounding Anchor' },
    surprised: { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.45)', label: 'Curious & Wonder' },
  };

  const theme = emotionThemes[emotion] || emotionThemes.neutral;

  // State-specific animation dynamics
  const getAnimationClass = () => {
    switch (state) {
      case 'listening':
        return 'animate-listening';
      case 'thinking':
        return 'animate-thinking';
      case 'speaking':
        return 'animate-speaking';
      default:
        return 'animate-breathing';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer Ripple / Wave Ring (Listening/Speaking) */}
        {(state === 'listening' || state === 'speaking') && (
          <div
            style={{
              position: 'absolute',
              inset: '-18px',
              borderRadius: '50%',
              border: `2px solid ${theme.color}`,
              opacity: 0.6,
              animation: 'ripple 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite',
            }}
          />
        )}

        {/* Orbit Ring (Thinking state) */}
        {state === 'thinking' && (
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: `2px dashed ${theme.color}`,
              animation: 'spin 3s linear infinite',
              opacity: 0.7,
            }}
          />
        )}

        {/* Outer Aura Halo */}
        <div
          style={{
            position: 'absolute',
            inset: '0px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.glow} 0%, transparent 72%)`,
            filter: 'blur(10px)',
            transition: 'background 800ms ease, inset 400ms ease',
          }}
        />

        {/* Core Living Emotional Sphere */}
        <div
          className={getAnimationClass()}
          style={{
            width: `${size * 0.76}px`,
            height: `${size * 0.76}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${theme.color} 55%, rgba(15, 23, 42, 0.9) 100%)`,
            boxShadow: `0 0 35px ${theme.glow}, inset 0 -6px 12px rgba(0, 0, 0, 0.4), inset 0 6px 10px rgba(255, 255, 255, 0.6)`,
            position: 'relative',
            transition: 'background 800ms ease, box-shadow 800ms ease',
            cursor: 'pointer',
          }}
          title={`${personaName} is ${state}`}
        >
          {/* Subtle Organic Iris / Spark */}
          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: '32%',
              width: '16%',
              height: '16%',
              borderRadius: '50%',
              background: '#ffffff',
              filter: 'blur(1px)',
              opacity: 0.85,
            }}
          />
        </div>
      </div>

      {/* State & Emotion Status Pill */}
      <div
        className="pill-tag"
        style={{
          border: `1px solid ${theme.color}44`,
          background: `${theme.color}15`,
          color: theme.color,
          fontSize: '0.78rem',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: theme.color,
            boxShadow: `0 0 8px ${theme.color}`,
          }}
        />
        <span>
          {state === 'listening'
            ? 'Listening to you...'
            : state === 'speaking'
            ? 'Speaking...'
            : state === 'thinking'
            ? 'Reflecting...'
            : theme.label}
        </span>
      </div>

      <style>{`
        .animate-breathing {
          animation: breathingOrb 4s ease-in-out infinite;
        }
        .animate-speaking {
          animation: speakingPulse 1.2s ease-in-out infinite alternate;
        }
        .animate-listening {
          animation: listeningExpand 1.5s ease-in-out infinite;
        }
        .animate-thinking {
          animation: thinkingWobble 2s ease-in-out infinite;
        }
        @keyframes speakingPulse {
          0% { transform: scale(0.96); }
          100% { transform: scale(1.08); filter: drop-shadow(0 0 25px ${theme.glow}); }
        }
        @keyframes listeningExpand {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
