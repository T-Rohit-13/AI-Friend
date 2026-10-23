import React, { useState, useEffect } from 'react';
import {
  getAvatarPreferences,
  type AvatarStyle,
  type CharacterGender,
} from '../../services/avatarPreferences';

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
  avatarStyle?: AvatarStyle;
  gender?: CharacterGender;
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
  onToggleAutoMood: _onToggleAutoMood,
  onSetOverrideEmotion: _onSetOverrideEmotion,
  showControls = false,
  avatarStyle: _avatarStyle,
  gender: _gender,
}) => {
  // Sync with user's saved preferences
  const [prefs, setPrefs] = useState(() => getAvatarPreferences());

  useEffect(() => {
    const handlePrefChange = (e: any) => {
      if (e.detail) setPrefs(e.detail);
    };
    window.addEventListener('ai_friend_avatar_prefs_changed', handlePrefChange);
    return () => window.removeEventListener('ai_friend_avatar_prefs_changed', handlePrefChange);
  }, []);

  // Determine effective expression: manual override or saved preference override takes priority
  const effectiveOverride = manualOverrideEmotion || (prefs.avatarMoodOverride && prefs.avatarMoodOverride !== 'auto' ? normalizeExpression(prefs.avatarMoodOverride) : null);
  const isAutoMoodActive = autoMoodEnabled && prefs.autoMoodEnabled !== false;

  const activeExpression: AvatarExpression = effectiveOverride
    ? effectiveOverride
    : isAutoMoodActive
    ? normalizeExpression(emotion)
    : 'neutral';

  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);

  // Periodic natural blink for Emoji companion
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

  // Expressive Animated Emoji Companion (smooth vector with rich expressions, eyelid physics & speech sync)
  // Option A: Animated Emoji Companion (improved with soft pastel aesthetic, smooth expressions & speech sync)
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
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 44 48 Q 58 41 70 47" />
            <path d="M 90 47 Q 102 41 116 48" />
          </g>
        );
      case 'excited':
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 44 45 Q 58 37 70 44" />
            <path d="M 90 44 Q 102 37 116 45" />
          </g>
        );
      case 'sad':
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 45 46 Q 58 52 70 47" />
            <path d="M 90 47 Q 102 52 115 46" />
          </g>
        );
      case 'calm':
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 46 50 Q 58 48 70 50" />
            <path d="M 90 50 Q 102 48 114 50" />
          </g>
        );
      case 'frustrated':
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 45 47 Q 58 51 70 53" />
            <path d="M 90 53 Q 102 51 115 47" />
          </g>
        );
      case 'confused':
        return (
          <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 44 42 Q 57 37 69 43" />
            <path d="M 90 51 Q 102 53 115 50" />
          </g>
        );
      case 'neutral':
      default:
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

    if (isBlinking) {
      return (
        <g stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <line x1="50" y1="67" x2="68" y2="67" />
          <line x1="92" y1="67" x2="110" y2="67" />
        </g>
      );
    }

    if (activeExpression === 'happy' && state !== 'listening') {
      return (
        <g stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M 50 68 Q 59 60 68 68" />
          <path d="M 92 68 Q 101 60 110 68" />
        </g>
      );
    }

    if (activeExpression === 'excited') {
      return (
        <g>
          <circle cx="59" cy="66" r="7.5" fill={color} />
          <circle cx="101" cy="66" r="7.5" fill={color} />
          {/* Sparkles */}
          <circle cx="57" cy="64" r="2.8" fill="#FFFFFF" />
          <circle cx="99" cy="64" r="2.8" fill="#FFFFFF" />
          <circle cx="62" cy="68" r="1.2" fill="#FFFFFF" />
          <circle cx="104" cy="68" r="1.2" fill="#FFFFFF" />
        </g>
      );
    }

    // Default open, attentive eyes with natural glint
    return (
      <g>
        <circle cx="59" cy="67" r="6.5" fill={color} />
        <circle cx="101" cy="67" r="6.5" fill={color} />
        <circle cx="57.2" cy="65.2" r="2.4" fill="#FFFFFF" />
        <circle cx="99.2" cy="65.2" r="2.4" fill="#FFFFFF" />
      </g>
    );
  };

  // Mouth geometry based on emotion + speech state
  const renderMouth = () => {
    const color = style.featureColor;

    // Talking mouth movement when speaking
    if (state === 'speaking') {
      switch (mouthPhase) {
        case 0:
          return (
            <path
              d="M 68 85 Q 80 81 92 85 Q 80 98 68 85 Z"
              fill="#E76F42"
              stroke={color}
              strokeWidth="2.5"
            />
          );
        case 1:
          return (
            <ellipse
              cx="80"
              cy="86"
              rx="7"
              ry="8"
              fill="#E76F42"
              stroke={color}
              strokeWidth="2.5"
            />
          );
        case 2:
          return (
            <path
              d="M 70 85 Q 80 82 90 85 Q 80 93 70 85 Z"
              fill="#E76F42"
              stroke={color}
              strokeWidth="2.5"
            />
          );
        case 3:
        default:
          return (
            <path
              d="M 70 86 Q 80 90 90 86"
              fill="none"
              stroke={color}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          );
      }
    }

    // Emotion resting mouth shapes
    switch (activeExpression) {
      case 'happy':
        return (
          <path
            d="M 66 84 Q 80 97 94 84"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        );
      case 'excited':
        return (
          <path
            d="M 68 83 Q 80 99 92 83 Z"
            fill="#FA9F7A"
            stroke={color}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        );
      case 'sad':
        return (
          <path
            d="M 68 91 Q 80 83 92 91"
            fill="none"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        );
      case 'calm':
        return (
          <path
            d="M 70 86 Q 80 89 90 86"
            fill="none"
            stroke={color}
            strokeWidth="3.0"
            strokeLinecap="round"
          />
        );
      case 'frustrated':
        return (
          <path
            d="M 71 88 L 89 88"
            fill="none"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        );
      case 'confused':
        return (
          <path
            d="M 70 88 Q 75 86 80 88 Q 85 90 90 87"
            fill="none"
            stroke={color}
            strokeWidth="3.0"
            strokeLinecap="round"
          />
        );
      case 'neutral':
      default:
        return (
          <path
            d="M 72 87 Q 80 89 88 87"
            fill="none"
            stroke={color}
            strokeWidth="3.0"
            strokeLinecap="round"
          />
        );
    }
  };

  return (
    <div
      className="emotional-avatar-container"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        transition: 'transform 300ms ease',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 160 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter:
            state === 'listening'
              ? 'drop-shadow(0 0 16px rgba(99, 216, 165, 0.6))'
              : state === 'speaking'
              ? 'drop-shadow(0 0 16px rgba(157, 141, 241, 0.6))'
              : `drop-shadow(0 8px 24px ${style.auraColor})`,
          transition: 'filter 400ms ease',
        }}
        aria-label={`${personaName} Animated Emoji Avatar (${activeExpression})`}
      >
        <defs>
          <radialGradient id="avatarAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={style.auraColor} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="avatarFace" x1="0" y1="20" x2="0" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={style.skinGradStart} />
            <stop offset="100%" stopColor={style.skinGradEnd} />
          </linearGradient>

          {/* Listening Pulsing Glow Ring */}
          {state === 'listening' && (
            <filter id="listeningGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Ambient Halo */}
        <circle cx="80" cy="80" r="74" fill="url(#avatarAura)" />

        {/* Active Listening Pulse Ring */}
        {state === 'listening' && (
          <circle
            cx="80"
            cy="80"
            r="66"
            stroke="var(--pastel-mint-accent, #63D8A5)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            fill="none"
            opacity="0.8"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 80 80"
              to="360 80 80"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Main Face Contour */}
        <circle
          cx="80"
          cy="80"
          r="58"
          fill="url(#avatarFace)"
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="3.5"
        />

        {/* Soft Blush Cheeks */}
        <ellipse
          cx="52"
          cy="80"
          rx="9"
          ry="5.5"
          fill={style.blushColor}
          fillOpacity={style.blushOpacity}
        />
        <ellipse
          cx="108"
          cy="80"
          rx="9"
          ry="5.5"
          fill={style.blushColor}
          fillOpacity={style.blushOpacity}
        />

        {/* Facial Features */}
        {renderEyebrows()}
        {renderEyes()}
        {renderMouth()}
      </svg>

      {/* Optional Companion Controls / Info */}
      {showControls && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '6px',
            fontSize: '0.8rem',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Emoji Companion: {style.label}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Universal Compact Companion Avatar Icon
 * Automatically renders either Emoji or Human-Like avatar in compact dimensions (e.g., 32px or 44px).
 */
export const CompanionMiniAvatar: React.FC<{
  size?: number;
  emotion?: string;
  state?: CompanionState;
}> = ({ size = 32, emotion = 'neutral', state = 'idle' }) => {
  const [prefs, setPrefs] = useState(() => getAvatarPreferences());

  useEffect(() => {
    const handlePrefChange = (e: any) => {
      if (e.detail) setPrefs(e.detail);
    };
    window.addEventListener('ai_friend_avatar_prefs_changed', handlePrefChange);
    return () => window.removeEventListener('ai_friend_avatar_prefs_changed', handlePrefChange);
  }, []);

  const normalized = (prefs.avatarMoodOverride && prefs.avatarMoodOverride !== 'auto')
    ? normalizeExpression(prefs.avatarMoodOverride)
    : (prefs.autoMoodEnabled !== false)
    ? normalizeExpression(emotion)
    : 'neutral';

  // Emoji mini avatar
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--current-pastel-gradient, linear-gradient(135deg, #9D8DF1, #78C6F1))',
        boxShadow: '0 2px 8px rgba(157, 141, 241, 0.3)',
        flexShrink: 0,
      }}
    >
      <EmotionalAvatar
        emotion={normalized}
        state={state}
        size={size * 1.1}
        showControls={false}
      />
    </div>
  );
};
