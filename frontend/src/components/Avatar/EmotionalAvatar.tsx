import React from 'react';

export type CompanionState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface EmotionalAvatarProps {
  emotion: string; // 'neutral' | 'happy' | 'sad' | 'angry' | 'anxious' | 'calm'
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
  // Soft Pastel Emotion Color Palette
  const emotionThemes: Record<
    string,
    { color: string; glow: string; earColor: string; label: string; eyeColor: string }
  > = {
    neutral: {
      color: '#78C6F1',
      glow: 'rgba(120, 198, 241, 0.45)',
      earColor: '#D6EEFC',
      label: 'Balanced & Peaceful',
      eyeColor: '#78C6F1',
    },
    warm: {
      color: '#9D8DF1',
      glow: 'rgba(157, 141, 241, 0.45)',
      earColor: '#E4E0F7',
      label: 'Warm & Caring',
      eyeColor: '#9D8DF1',
    },
    calm: {
      color: '#63D8A5',
      glow: 'rgba(99, 216, 165, 0.45)',
      earColor: '#D1F5E4',
      label: 'Peaceful Calm',
      eyeColor: '#63D8A5',
    },
    sad: {
      color: '#9D8DF1',
      glow: 'rgba(157, 141, 241, 0.4)',
      earColor: '#E4E0F7',
      label: 'Gentle Support',
      eyeColor: '#9D8DF1',
    },
    compassionate: {
      color: '#9D8DF1',
      glow: 'rgba(157, 141, 241, 0.45)',
      earColor: '#E4E0F7',
      label: 'Compassionate Anchor',
      eyeColor: '#9D8DF1',
    },
    anxious: {
      color: '#63D8A5',
      glow: 'rgba(99, 216, 165, 0.45)',
      earColor: '#D1F5E4',
      label: 'Soothing Grounding',
      eyeColor: '#63D8A5',
    },
    angry: {
      color: '#9D8DF1',
      glow: 'rgba(157, 141, 241, 0.45)',
      earColor: '#E4E0F7',
      label: 'Cooling Safe Space',
      eyeColor: '#9D8DF1',
    },
    happy: {
      color: '#FA9F7A',
      glow: 'rgba(250, 159, 122, 0.5)',
      earColor: '#FCE4D6',
      label: 'Joyful Radiance',
      eyeColor: '#FA9F7A',
    },
    joyful: {
      color: '#FA9F7A',
      glow: 'rgba(250, 159, 122, 0.5)',
      earColor: '#FCE4D6',
      label: 'Joyful Radiance',
      eyeColor: '#FA9F7A',
    },
    playful: {
      color: '#FA9F7A',
      glow: 'rgba(250, 159, 122, 0.5)',
      earColor: '#FCE4D6',
      label: 'Playful Fun',
      eyeColor: '#FA9F7A',
    },
  };

  const activeKey = emotion ? emotion.toLowerCase() : 'neutral';
  const theme = emotionThemes[activeKey] || emotionThemes.neutral;

  // Scale dimensions proportionally
  const width = size;
  const height = size * 1.05;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Floating Robot Container */}
      <div
        className="animate-robot-hover"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: `drop-shadow(0 12px 24px ${theme.glow})`,
          transition: 'filter 600ms ease',
        }}
        title={`${personaName} is ${state}`}
      >
        {/* Soft Ambient Aura Halo */}
        <div
          style={{
            position: 'absolute',
            inset: '10px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
            filter: 'blur(16px)',
            opacity: state === 'listening' || state === 'speaking' ? 0.9 : 0.6,
            transition: 'all 600ms ease',
          }}
        />

        {/* Outer Ripple Wave when Speaking or Listening */}
        {(state === 'listening' || state === 'speaking') && (
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              border: `2px solid ${theme.color}`,
              animation: 'ripplePulse 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Cute Vector Robot SVG */}
        <svg
          viewBox="0 0 160 160"
          width={width}
          height={height}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Robot Head Body Gradient */}
            <linearGradient id="robotBodyGrad" x1="20" y1="20" x2="140" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.6" stopColor="#F6F3FC" />
              <stop offset="1" stopColor="#E9E4F5" />
            </linearGradient>

            {/* Visor Screen Dark Glass Gradient */}
            <linearGradient id="visorScreenGrad" x1="30" y1="40" x2="130" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E1933" />
              <stop offset="0.7" stopColor="#161226" />
              <stop offset="1" stopColor="#0F0C1B" />
            </linearGradient>

            {/* Antenna LED Glow Filter */}
            <filter id="antennaGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ─── 1. Top Antenna ─── */}
          <g>
            {/* Antenna Stem */}
            <line
              x1="80"
              y1="34"
              x2="80"
              y2="14"
              stroke="#D3CBEA"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Antenna Core Orb */}
            <circle
              cx="80"
              cy="12"
              r="7"
              fill={theme.color}
              filter="url(#antennaGlow)"
              className={state === 'thinking' || state === 'listening' ? 'animate-antenna-pulse' : ''}
              style={{
                transition: 'fill 500ms ease',
              }}
            />
            {/* Orbiting Ring during Thinking state */}
            {state === 'thinking' && (
              <circle
                cx="80"
                cy="12"
                r="12"
                stroke={theme.color}
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
                style={{
                  transformOrigin: '80px 12px',
                  animation: 'thinkingRotate 2.4s linear infinite',
                }}
              />
            )}
          </g>

          {/* ─── 2. Ear / Headphone Modules ─── */}
          {/* Left Ear */}
          <g className={state === 'listening' ? 'animate-antenna-pulse' : ''}>
            <rect
              x="12"
              y="58"
              width="14"
              height="36"
              rx="7"
              fill="#ECE7F8"
              stroke="#D3CBEA"
              strokeWidth="2"
            />
            <rect
              x="14"
              y="64"
              width="8"
              height="24"
              rx="4"
              fill={theme.color}
              opacity="0.85"
            />
          </g>

          {/* Right Ear */}
          <g className={state === 'listening' ? 'animate-antenna-pulse' : ''}>
            <rect
              x="134"
              y="58"
              width="14"
              height="36"
              rx="7"
              fill="#ECE7F8"
              stroke="#D3CBEA"
              strokeWidth="2"
            />
            <rect
              x="138"
              y="64"
              width="8"
              height="24"
              rx="4"
              fill={theme.color}
              opacity="0.85"
            />
          </g>

          {/* ─── 3. Main Head Chassis ─── */}
          <rect
            x="24"
            y="32"
            width="112"
            height="96"
            rx="32"
            fill="url(#robotBodyGrad)"
            stroke="#D8D0EC"
            strokeWidth="2.5"
            style={{
              filter: 'drop-shadow(0 6px 14px rgba(130, 110, 180, 0.15))',
            }}
          />

          {/* ─── 4. Visor Face Display Screen ─── */}
          <rect
            x="34"
            y="42"
            width="92"
            height="76"
            rx="24"
            fill="url(#visorScreenGrad)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1.5"
          />

          {/* Screen Light Gloss Reflection */}
          <path
            d="M 40 48 Q 80 43 120 48 Q 110 58 46 58 Z"
            fill="rgba(255, 255, 255, 0.08)"
          />

          {/* ─── 5. Blushing Cheeks ─── */}
          <ellipse cx="49" cy="88" rx="7" ry="4" fill="#FBA984" opacity="0.65" filter="blur(1px)" />
          <ellipse cx="111" cy="88" rx="7" ry="4" fill="#FBA984" opacity="0.65" filter="blur(1px)" />

          {/* ─── 6. Expressive Eyes by State ─── */}
          {state === 'speaking' ? (
            /* Joyful Curved Eyes (^ ^) when speaking */
            <g stroke={theme.eyeColor} strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M 52 74 Q 60 64 68 74" />
              <path d="M 92 74 Q 100 64 108 74" />
            </g>
          ) : state === 'thinking' ? (
            /* Thinking Curious Eyes (Looking up/wonder) */
            <g fill={theme.eyeColor}>
              <circle cx="60" cy="67" r="7" />
              <circle cx="100" cy="67" r="7" />
              {/* Eye sparkle reflection */}
              <circle cx="63" cy="64" r="2.5" fill="#FFFFFF" />
              <circle cx="103" cy="64" r="2.5" fill="#FFFFFF" />
            </g>
          ) : state === 'listening' ? (
            /* Attentive Wide Eyes with Concentric Rings */
            <g fill={theme.eyeColor}>
              <circle cx="60" cy="72" r="8" />
              <circle cx="100" cy="72" r="8" />
              <circle cx="60" cy="72" r="11" fill="none" stroke={theme.eyeColor} strokeWidth="1.5" opacity="0.5" />
              <circle cx="100" cy="72" r="11" fill="none" stroke={theme.eyeColor} strokeWidth="1.5" opacity="0.5" />
              <circle cx="63" cy="69" r="2.5" fill="#FFFFFF" />
              <circle cx="103" cy="69" r="2.5" fill="#FFFFFF" />
            </g>
          ) : (
            /* Idle Blinking Pill Eyes with Cute Shine */
            <g className="animate-robot-blink" fill={theme.eyeColor}>
              <rect x="52" y="64" width="16" height="18" rx="8" />
              <rect x="92" y="64" width="16" height="18" rx="8" />
              {/* White Glint */}
              <circle cx="56" cy="68" r="3" fill="#FFFFFF" />
              <circle cx="96" cy="68" r="3" fill="#FFFFFF" />
              <circle cx="63" cy="75" r="1.5" fill="#FFFFFF" />
              <circle cx="103" cy="75" r="1.5" fill="#FFFFFF" />
            </g>
          )}

          {/* ─── 7. Expressive Mouth by State ─── */}
          {state === 'speaking' ? (
            /* Dynamic Audio Wave Mouth */
            <g fill={theme.eyeColor}>
              <rect x="68" y="93" width="3" height="10" rx="1.5" className="animate-antenna-pulse" />
              <rect x="74" y="90" width="3" height="16" rx="1.5" style={{ animation: 'robotSpeakingWave 0.5s ease-in-out infinite' }} />
              <rect x="80" y="88" width="3" height="20" rx="1.5" style={{ animation: 'robotSpeakingWave 0.6s ease-in-out infinite' }} />
              <rect x="86" y="90" width="3" height="16" rx="1.5" style={{ animation: 'robotSpeakingWave 0.5s ease-in-out infinite' }} />
              <rect x="92" y="93" width="3" height="10" rx="1.5" className="animate-antenna-pulse" />
            </g>
          ) : state === 'listening' ? (
            /* Attentive Small Rounded Mouth (o) */
            <ellipse cx="80" cy="98" rx="4" ry="5" fill="none" stroke={theme.eyeColor} strokeWidth="2.5" />
          ) : state === 'thinking' ? (
            /* Soft Thinking Wave Mouth (~ ) */
            <path
              d="M 72 98 Q 76 95 80 98 Q 84 101 88 98"
              fill="none"
              stroke={theme.eyeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            /* Sweet Gentle Smile */
            <path
              d="M 72 96 Q 80 104 88 96"
              fill="none"
              stroke={theme.eyeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {/* Soft Ground Shadow that dynamically contracts on hover */}
      <div
        style={{
          width: `${width * 0.6}px`,
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(120, 100, 180, 0.22) 0%, transparent 70%)',
          marginTop: '-4px',
          filter: 'blur(2px)',
        }}
      />
    </div>
  );
};
