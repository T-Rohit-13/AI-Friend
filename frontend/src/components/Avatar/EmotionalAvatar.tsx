import React, { useState, useEffect } from 'react';

export type CompanionState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type AvatarExpression =
  | 'happy'
  | 'sad'
  | 'calm'
  | 'excited'
  | 'frustrated'
  | 'confused'
  | 'neutral';

export interface EmotionalAvatarProps {
  emotion: string;
  state: CompanionState;
  personaName?: string;
  size?: number;
  autoMoodEnabled?: boolean;
  manualOverrideEmotion?: AvatarExpression | null;
  onToggleAutoMood?: () => void;
  onSetOverrideEmotion?: (emotion: AvatarExpression | null) => void;
  showControls?: boolean;
}

/**
 * Normalizes backend or theme emotions into the 7 supported avatar facial expressions.
 * Handles low-confidence or uncertain states by defaulting to 'neutral'.
 */
export function normalizeExpression(rawEmotion: string | null | undefined): AvatarExpression {
  if (!rawEmotion) return 'neutral';
  const e = rawEmotion.toLowerCase().trim();

  if (['happy', 'joyful', 'joy', 'cheerful', 'playful', 'celebratory'].includes(e)) return 'happy';
  if (['excited', 'surprised', 'energetic', 'amazed'].includes(e)) return 'excited';
  if (['sad', 'depressed', 'gloomy', 'compassionate', 'down', 'tired'].includes(e)) return 'sad';
  if (['calm', 'peaceful', 'grounded', 'serene', 'relaxed'].includes(e)) return 'calm';
  if (['frustrated', 'angry', 'irritated', 'annoyed'].includes(e)) return 'frustrated';
  if (['confused', 'anxious', 'worried', 'nervous', 'puzzled', 'questioning'].includes(e)) return 'confused';

  return 'neutral';
}

export const EmotionalAvatar: React.FC<EmotionalAvatarProps> = ({
  emotion = 'neutral',
  state = 'idle',
  personaName = 'AI Friend',
  size = 140,
  autoMoodEnabled = true,
  manualOverrideEmotion = null,
  onToggleAutoMood,
  onSetOverrideEmotion,
  showControls = false,
}) => {
  // Determine effective expression: manual override takes priority, otherwise normalized input
  const activeExpression: AvatarExpression = manualOverrideEmotion
    ? manualOverrideEmotion
    : autoMoodEnabled
    ? normalizeExpression(emotion)
    : 'neutral';

  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);

  // Periodic natural blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800 + Math.random() * 2200);

    return () => clearInterval(blinkInterval);
  }, []);

  // Natural talking lip-sync animation while speaking
  useEffect(() => {
    if (state !== 'speaking') {
      setMouthPhase(0);
      return;
    }
    const talkTimer = setInterval(() => {
      setMouthPhase((prev) => (prev + 1) % 4);
    }, 140);

    return () => clearInterval(talkTimer);
  }, [state]);

  // Soft Pastel Palette corresponding to emotional tone
  const expressionStyles: Record<
    AvatarExpression,
    {
      skinGradStart: string;
      skinGradEnd: string;
      auraColor: string;
      featureColor: string;
      blushColor: string;
      blushOpacity: number;
      label: string;
    }
  > = {
    happy: {
      skinGradStart: '#FFF9F0',
      skinGradEnd: '#FFEAD4',
      auraColor: 'rgba(250, 159, 122, 0.45)',
      featureColor: '#5C4033',
      blushColor: '#FA9F7A',
      blushOpacity: 0.75,
      label: 'Happy & Warm',
    },
    excited: {
      skinGradStart: '#FFFBF2',
      skinGradEnd: '#FFE3C6',
      auraColor: 'rgba(255, 183, 77, 0.55)',
      featureColor: '#4A3225',
      blushColor: '#FF8A65',
      blushOpacity: 0.85,
      label: 'Excited & Sparkling',
    },
    sad: {
      skinGradStart: '#F7F5FC',
      skinGradEnd: '#E8E3F8',
      auraColor: 'rgba(157, 141, 241, 0.40)',
      featureColor: '#4A4269',
      blushColor: '#B39DDB',
      blushOpacity: 0.45,
      label: 'Gentle & Supportive',
    },
    calm: {
      skinGradStart: '#F4FBF7',
      skinGradEnd: '#DCF5E8',
      auraColor: 'rgba(99, 216, 165, 0.40)',
      featureColor: '#2D5544',
      blushColor: '#80CBC4',
      blushOpacity: 0.45,
      label: 'Serene & Calm',
    },
    frustrated: {
      skinGradStart: '#FFF5F5',
      skinGradEnd: '#FCE0E0',
      auraColor: 'rgba(239, 115, 115, 0.45)',
      featureColor: '#6B3030',
      blushColor: '#EF9A9A',
      blushOpacity: 0.6,
      label: 'Empathetic & Attentive',
    },
    confused: {
      skinGradStart: '#FDF7FD',
      skinGradEnd: '#EFE5F7',
      auraColor: 'rgba(186, 104, 200, 0.40)',
      featureColor: '#4D3357',
      blushColor: '#CE93D8',
      blushOpacity: 0.5,
      label: 'Curious & Inquisitive',
    },
    neutral: {
      skinGradStart: '#F8FAFC',
      skinGradEnd: '#E6EFF7',
      auraColor: 'rgba(120, 198, 241, 0.35)',
      featureColor: '#334E68',
      blushColor: '#B0BEC5',
      blushOpacity: 0.35,
      label: 'Attentive & Ready',
    },
  };

  const style = expressionStyles[activeExpression];
  const width = size;
  const height = size * 1.05;

  // Eyebrow geometry based on emotion
  const renderEyebrows = () => {
    const color = style.featureColor;
    const strokeWidth = 3.5;

    switch (activeExpression) {
      case 'happy':
        // High, cheerful arched brows
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 44 48 Q 58 41 70 47" />
            <path d="M 90 47 Q 102 41 116 48" />
          </g>
        );
      case 'excited':
        // Lifted high with enthusiasm
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 44 45 Q 58 37 70 44" />
            <path d="M 90 44 Q 102 37 116 45" />
          </g>
        );
      case 'sad':
        // Compassionate upward inner tilt
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 45 46 Q 58 52 70 47" />
            <path d="M 90 47 Q 102 52 115 46" />
          </g>
        );
      case 'calm':
        // Flat, relaxed natural curve
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 46 50 Q 58 48 70 50" />
            <path d="M 90 50 Q 102 48 114 50" />
          </g>
        );
      case 'frustrated':
        // Furrowed brow, angled inward
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 45 47 Q 58 51 70 53" />
            <path d="M 90 53 Q 102 51 115 47" />
          </g>
        );
      case 'confused':
        // Asymmetric: one raised inquisitive brow, one lowered
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 44 42 Q 57 37 69 43" />
            <path d="M 90 51 Q 102 53 115 50" />
          </g>
        );
      case 'neutral':
      default:
        // Soft, neutral attentive arcs
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 46 49 Q 58 45 70 49" />
            <path d="M 90 49 Q 102 45 114 49" />
          </g>
        );
    }
  };

  // Eyes geometry based on emotion + blinking + state
  const renderEyes = () => {
    const color = style.featureColor;

    // Blink state takes precedence
    if (isBlinking) {
      return (
        <g stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <line x1="50" y1="67" x2="68" y2="67" />
          <line x1="92" y1="67" x2="110" y2="67" />
        </g>
      );
    }

    if (activeExpression === 'happy' && state !== 'listening') {
      // Crescent smiling eyes (^ ^)
      return (
        <g stroke={color} strokeWidth="3.8" strokeLinecap="round" fill="none">
          <path d="M 48 68 Q 58 58 68 68" />
          <path d="M 92 68 Q 102 58 112 68" />
        </g>
      );
    }

    if (activeExpression === 'excited') {
      // Big sparkling round eyes with twinkles
      return (
        <g fill={color}>
          <circle cx="58" cy="65" r="9" />
          <circle cx="102" cy="65" r="9" />
          <circle cx="55" cy="61" r="3.2" fill="#FFFFFF" />
          <circle cx="99" cy="61" r="3.2" fill="#FFFFFF" />
          <circle cx="62" cy="68" r="1.8" fill="#FFFFFF" />
          <circle cx="106" cy="68" r="1.8" fill="#FFFFFF" />
        </g>
      );
    }

    if (activeExpression === 'sad') {
      // Gentle drooping eyelids
      return (
        <g>
          <ellipse cx="58" cy="66" rx="7.5" ry="7" fill={color} />
          <ellipse cx="102" cy="66" rx="7.5" ry="7" fill={color} />
          <circle cx="56" cy="63" r="2.4" fill="#FFFFFF" />
          <circle cx="100" cy="63" r="2.4" fill="#FFFFFF" />
          {/* Eyelid cover */}
          <path d="M 50 63 Q 58 66 66 63" stroke={style.skinGradEnd} strokeWidth="3" fill="none" />
          <path d="M 94 63 Q 102 66 110 63" stroke={style.skinGradEnd} strokeWidth="3" fill="none" />
        </g>
      );
    }

    if (activeExpression === 'calm') {
      // Soft half-lidded serene gaze
      return (
        <g stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M 49 66 Q 58 71 67 66" />
          <path d="M 93 66 Q 102 71 111 66" />
        </g>
      );
    }

    if (activeExpression === 'frustrated') {
      // Narrowed, focused gaze
      return (
        <g fill={color}>
          <ellipse cx="58" cy="66" rx="7" ry="5.5" />
          <ellipse cx="102" cy="66" rx="7" ry="5.5" />
          <circle cx="57" cy="64" r="2" fill="#FFFFFF" />
          <circle cx="101" cy="64" r="2" fill="#FFFFFF" />
        </g>
      );
    }

    if (activeExpression === 'confused') {
      // Asymmetric: one slightly squinted, one wide
      return (
        <g fill={color}>
          <ellipse cx="58" cy="64" rx="8" ry="8" />
          <circle cx="56" cy="61" r="2.8" fill="#FFFFFF" />
          <ellipse cx="102" cy="66" rx="6.5" ry="5" />
          <circle cx="101" cy="64" r="2" fill="#FFFFFF" />
        </g>
      );
    }

    // Default Neutral / Attentive Eyes
    return (
      <g fill={color}>
        <ellipse cx="58" cy="65" rx="7.5" ry="8" />
        <ellipse cx="102" cy="65" rx="7.5" ry="8" />
        <circle cx="55.5" cy="62" r="2.8" fill="#FFFFFF" />
        <circle cx="99.5" cy="62" r="2.8" fill="#FFFFFF" />
        <circle cx="61" cy="68" r="1.4" fill="#FFFFFF" />
        <circle cx="105" cy="68" r="1.4" fill="#FFFFFF" />
      </g>
    );
  };

  // Mouth geometry based on emotion + speaking lip-sync
  const renderMouth = () => {
    const color = style.featureColor;

    // Speaking lip-sync animation
    if (state === 'speaking') {
      if (mouthPhase === 0) {
        // Closed / gentle
        return <path d="M 72 90 Q 80 94 88 90" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />;
      } else if (mouthPhase === 1) {
        // Open oval phoneme
        return <ellipse cx="80" cy="91" rx="5.5" ry="6" fill={color} />;
      } else if (mouthPhase === 2) {
        // Wide smile open
        return (
          <path
            d="M 70 89 Q 80 100 90 89 Q 80 95 70 89 Z"
            fill={color}
          />
        );
      } else {
        // Small round 'oo' shape
        return <ellipse cx="80" cy="91" rx="4" ry="5" fill={color} />;
      }
    }

    // Static emotional mouth shapes
    switch (activeExpression) {
      case 'happy':
        // Wide, cheerful curved smile with dimple hints
        return (
          <g>
            <path
              d="M 68 88 Q 80 102 92 88"
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Dimples */}
            <path d="M 66 87 Q 67 89 68 91" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 94 87 Q 93 89 92 91" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'excited':
        // Open joyous laughing smile
        return (
          <g>
            <path
              d="M 69 86 Q 80 104 91 86 Q 80 91 69 86 Z"
              fill={color}
            />
            <path
              d="M 74 95 Q 80 97 86 95"
              stroke="#FF8A65"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        );

      case 'sad':
        // Gentle, empathetic downturned curve
        return (
          <path
            d="M 71 94 Q 80 88 89 94"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
        );

      case 'calm':
        // Soft serene slight smile
        return (
          <path
            d="M 73 90 Q 80 95 87 90"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        );

      case 'frustrated':
        // Straight / slightly wavy tense line
        return (
          <path
            d="M 72 92 L 88 92"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
        );

      case 'confused':
        // Off-center questioning quirk
        return (
          <path
            d="M 72 92 Q 78 93 84 90 Q 88 88 90 91"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        );

      case 'neutral':
      default:
        // Gentle relaxed natural arc
        return (
          <path
            d="M 73 91 Q 80 95 87 91"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        );
    }
  };

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
      {/* Avatar Face Container with Floating Animation & Glow */}
      <div
        className="animate-robot-hover"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: `drop-shadow(0 14px 28px ${style.auraColor})`,
          transition: 'filter 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        title={`${personaName} • Expression: ${style.label} (${activeExpression})`}
      >
        {/* Soft Ambient Aura Halo */}
        <div
          style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${style.auraColor} 0%, transparent 72%)`,
            filter: 'blur(16px)',
            opacity: state === 'listening' || state === 'speaking' ? 0.95 : 0.65,
            transition: 'all 500ms ease',
          }}
        />

        {/* Pulse Ripple when Listening or Speaking */}
        {(state === 'listening' || state === 'speaking') && (
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: `2px solid ${style.featureColor}`,
              opacity: 0.4,
              animation: 'ripplePulse 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Expressive Friendly Face SVG */}
        <svg
          viewBox="0 0 160 160"
          width={width}
          height={height}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible', transition: 'all 400ms ease' }}
        >
          <defs>
            <linearGradient id="avatarSkinGrad" x1="30" y1="20" x2="130" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor={style.skinGradStart} />
              <stop offset="1" stopColor={style.skinGradEnd} />
            </linearGradient>

            <filter id="blushGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
            </filter>
          </defs>

          {/* 1. Cute Soft Ears */}
          <ellipse cx="26" cy="74" rx="8" ry="12" fill={style.skinGradEnd} stroke="#E2D9F3" strokeWidth="1.5" />
          <ellipse cx="134" cy="74" rx="8" ry="12" fill={style.skinGradEnd} stroke="#E2D9F3" strokeWidth="1.5" />

          {/* 2. Main Friendly Face Canvas (Soft Rounded Aesthetic) */}
          <rect
            x="28"
            y="26"
            width="104"
            height="102"
            rx="50"
            fill="url(#avatarSkinGrad)"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="2.5"
            style={{
              filter: 'drop-shadow(0 6px 16px rgba(120, 100, 160, 0.12))',
              transition: 'all 450ms ease',
            }}
          />

          {/* Subtle Top Gloss Arc */}
          <path
            d="M 44 38 Q 80 30 116 38"
            stroke="rgba(255, 255, 255, 0.65)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* 3. Rosy Cheeks (Blush) */}
          <ellipse
            cx="46"
            cy="78"
            rx="8"
            ry="5"
            fill={style.blushColor}
            opacity={style.blushOpacity}
            filter="url(#blushGlow)"
            style={{ transition: 'all 400ms ease' }}
          />
          <ellipse
            cx="114"
            cy="78"
            rx="8"
            ry="5"
            fill={style.blushColor}
            opacity={style.blushOpacity}
            filter="url(#blushGlow)"
            style={{ transition: 'all 400ms ease' }}
          />

          {/* 4. Expressive Eyebrows */}
          <g style={{ transition: 'all 350ms ease' }}>
            {renderEyebrows()}
          </g>

          {/* 5. Expressive Eyes & Eyelids */}
          <g style={{ transition: 'all 350ms ease' }}>
            {renderEyes()}
          </g>

          {/* 6. Cute Little Button Nose */}
          <ellipse cx="80" cy="76" rx="2.5" ry="1.8" fill={style.featureColor} opacity="0.35" />

          {/* 7. Expressive Animated Mouth */}
          <g style={{ transition: 'all 250ms ease' }}>
            {renderMouth()}
          </g>

          {/* 8. Listening / Thinking Status Indicators */}
          {state === 'thinking' && (
            <g>
              <circle cx="80" cy="18" r="4" fill={style.featureColor} opacity="0.8" />
              <circle cx="68" cy="18" r="3" fill={style.featureColor} opacity="0.5" />
              <circle cx="92" cy="18" r="3" fill={style.featureColor} opacity="0.5" />
            </g>
          )}

          {state === 'listening' && (
            <circle
              cx="80"
              cy="18"
              r="4.5"
              fill="#63D8A5"
              className="animate-antenna-pulse"
            />
          )}
        </svg>
      </div>

      {/* Soft Ground Shadow */}
      <div
        style={{
          width: `${width * 0.55}px`,
          height: '7px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(120, 100, 180, 0.22) 0%, transparent 70%)',
          marginTop: '-3px',
          filter: 'blur(2px)',
        }}
      />

      {/* Manual Override & Mood Toggle Controls (if enabled) */}
      {showControls && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                checked={autoMoodEnabled}
                onChange={onToggleAutoMood}
                style={{ cursor: 'pointer' }}
              />
              Auto Mood
            </label>

            <select
              value={manualOverrideEmotion || ''}
              onChange={(e) => {
                const val = e.target.value as AvatarExpression;
                if (onSetOverrideEmotion) {
                  onSetOverrideEmotion(val ? val : null);
                }
              }}
              className="select-input"
              style={{
                padding: '2px 8px',
                fontSize: '0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
              aria-label="Override Avatar Facial Expression"
            >
              <option value="">(Auto: {style.label})</option>
              <option value="happy">Happy 😊</option>
              <option value="excited">Excited 🤩</option>
              <option value="calm">Calm 😌</option>
              <option value="sad">Sad 🥺</option>
              <option value="frustrated">Frustrated 😤</option>
              <option value="confused">Confused 🤨</option>
              <option value="neutral">Neutral 😐</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
