import React, { useState, useEffect } from 'react';
import type { CompanionState, AvatarExpression } from './EmotionalAvatar';
import type { CharacterGender } from '../../services/avatarPreferences';

interface HumanAvatarProps {
  gender: CharacterGender;
  expression: AvatarExpression;
  state: CompanionState;
  size?: number;
  className?: string;
}

/**
 * Stylized Human-Like Animated Companion Avatar
 * Provides high-fidelity, friendly vector facial animation for both male and female characters.
 * Supports smooth blinking, eyebrow positioning, idle breathing, and talking lip-sync.
 */
export const HumanAvatar: React.FC<HumanAvatarProps> = ({
  gender = 'female',
  expression = 'neutral',
  state = 'idle',
  size = 130,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3600 + Math.random() * 2400);

    return () => clearInterval(blinkInterval);
  }, []);

  // Synchronized lip-sync talking animation when speaking
  useEffect(() => {
    if (state !== 'speaking') {
      setMouthPhase(0);
      return;
    }
    const talkTimer = setInterval(() => {
      setMouthPhase((prev) => (prev + 1) % 4);
    }, 130);

    return () => clearInterval(talkTimer);
  }, [state]);

  const isFemale = gender === 'female';
  const width = size;
  const height = size * 1.08;

  // Eyebrow geometry based on expression
  const renderEyebrows = () => {
    const browColor = isFemale ? '#4A3528' : '#322822';
    const strokeWidth = isFemale ? 3.0 : 3.8;

    switch (expression) {
      case 'happy':
        return (
          <g stroke={browColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 38 48 Q 50 42 62 47" />
            <path d="M 78 47 Q 90 42 102 48" />
          </g>
        );
      case 'excited':
        return (
          <g stroke={browColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 38 45 Q 50 38 62 44" />
            <path d="M 78 44 Q 90 38 102 45" />
          </g>
        );
      case 'sad':
        return (
          <g stroke={browColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 38 46 Q 50 51 62 47" />
            <path d="M 78 47 Q 90 51 102 46" />
          </g>
        );
      case 'calm':
        return (
          <g stroke={browColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 39 49 Q 50 48 61 49" />
            <path d="M 79 49 Q 90 48 101 49" />
          </g>
        );
      case 'frustrated':
        return (
          <g stroke={browColor} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" fill="none">
            <path d="M 38 46 Q 50 50 62 52" />
            <path d="M 78 52 Q 90 50 102 46" />
          </g>
        );
      case 'confused':
        return (
          <g stroke={browColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 38 42 Q 50 38 62 43" />
            <path d="M 78 50 Q 90 52 102 49" />
          </g>
        );
      case 'neutral':
      default:
        return (
          <g stroke={browColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            <path d="M 39 48 Q 50 45 61 48" />
            <path d="M 79 48 Q 90 45 101 48" />
          </g>
        );
    }
  };

  // Eyes geometry with pupils, eye highlights, and eyelashes
  const renderEyes = () => {
    const irisColor = isFemale ? '#4F3B78' : '#2B4365';
    const pupilColor = '#1A1824';

    if (isBlinking) {
      return (
        <g stroke="#3A2D27" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 42 63 Q 50 67 58 63" />
          <path d="M 82 63 Q 90 67 98 63" />
        </g>
      );
    }

    if (expression === 'happy' && state !== 'listening') {
      // Cheerful crescent smiling eyes
      return (
        <g stroke="#3A2D27" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 41 64 Q 50 58 59 64" />
          <path d="M 81 64 Q 90 58 99 64" />
          {isFemale && (
            <>
              <line x1="60" y1="63" x2="63" y2="60" strokeWidth="2.2" />
              <line x1="100" y1="63" x2="103" y2="60" strokeWidth="2.2" />
            </>
          )}
        </g>
      );
    }

    // Open expressive eyes
    return (
      <g>
        {/* Eye Whites */}
        <ellipse cx="50" cy="63" rx="9.5" ry="6.8" fill="#FFFFFF" />
        <ellipse cx="90" cy="63" rx="9.5" ry="6.8" fill="#FFFFFF" />

        {/* Iris */}
        <ellipse cx="50" cy="63" rx="5.5" ry="5.5" fill={irisColor} />
        <ellipse cx="90" cy="63" rx="5.5" ry="5.5" fill={irisColor} />

        {/* Pupil */}
        <ellipse cx="50" cy="63" rx="3.2" ry="3.2" fill={pupilColor} />
        <ellipse cx="90" cy="63" rx="3.2" ry="3.2" fill={pupilColor} />

        {/* Light Reflection Sparkles */}
        <circle cx="48.5" cy="61" r="1.5" fill="#FFFFFF" />
        <circle cx="88.5" cy="61" r="1.5" fill="#FFFFFF" />
        <circle cx="51.5" cy="64.5" r="0.75" fill="#FFFFFF" opacity="0.8" />
        <circle cx="91.5" cy="64.5" r="0.75" fill="#FFFFFF" opacity="0.8" />

        {/* Eyelash details for female companion */}
        {isFemale && (
          <g stroke="#3A2D27" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M 40 61 Q 50 56 60 61" />
            <path d="M 80 61 Q 90 56 100 61" />
            <line x1="60" y1="60" x2="63.5" y2="57.5" strokeWidth="1.8" />
            <line x1="100" y1="60" x2="103.5" y2="57.5" strokeWidth="1.8" />
          </g>
        )}
      </g>
    );
  };

  // Mouth rendering with dynamic speech lip-sync
  const renderMouth = () => {
    // When speaking: dynamic synchronized mouth movements
    if (state === 'speaking') {
      switch (mouthPhase) {
        case 0:
          // Wide open speaking
          return (
            <path
              d="M 60 84 Q 70 81 80 84 Q 70 94 60 84 Z"
              fill="#9C4444"
              stroke="#5A2E2E"
              strokeWidth="2"
            />
          );
        case 1:
          // Rounded 'O' shape
          return (
            <ellipse
              cx="70"
              cy="85"
              rx="6"
              ry="7"
              fill="#9C4444"
              stroke="#5A2E2E"
              strokeWidth="2"
            />
          );
        case 2:
          // Half open smile
          return (
            <path
              d="M 62 84 Q 70 82 78 84 Q 70 90 62 84 Z"
              fill="#9C4444"
              stroke="#5A2E2E"
              strokeWidth="2"
            />
          );
        case 3:
        default:
          // Closed smiling transition
          return (
            <path
              d="M 62 85 Q 70 89 78 85"
              fill="none"
              stroke="#5A2E2E"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          );
      }
    }

    // Emotion-specific resting mouth
    switch (expression) {
      case 'happy':
        return (
          <g>
            <path
              d="M 59 83 Q 70 93 81 83 Z"
              fill="#B85D5D"
              stroke="#5A2E2E"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Teeth highlight */}
            <path d="M 62 84 Q 70 88 78 84" fill="#FFFFFF" opacity="0.9" />
          </g>
        );
      case 'excited':
        return (
          <path
            d="M 58 82 Q 70 96 82 82 Z"
            fill="#B85D5D"
            stroke="#5A2E2E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      case 'sad':
        return (
          <path
            d="M 61 88 Q 70 83 79 88"
            fill="none"
            stroke="#5A2E2E"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        );
      case 'calm':
        return (
          <path
            d="M 62 85 Q 70 88 78 85"
            fill="none"
            stroke="#5A2E2E"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        );
      case 'frustrated':
        return (
          <path
            d="M 63 87 L 77 87"
            fill="none"
            stroke="#5A2E2E"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        );
      case 'confused':
        return (
          <path
            d="M 62 87 Q 67 85 71 87 Q 75 89 78 86"
            fill="none"
            stroke="#5A2E2E"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        );
      case 'neutral':
      default:
        return (
          <path
            d="M 63 86 Q 70 88 77 86"
            fill="none"
            stroke="#5A2E2E"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        );
    }
  };

  return (
    <div
      className={`human-avatar-container ${className}`}
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
        viewBox="0 0 140 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter:
            state === 'listening'
              ? 'drop-shadow(0 0 14px rgba(99, 216, 165, 0.55))'
              : state === 'speaking'
              ? 'drop-shadow(0 0 14px rgba(157, 141, 241, 0.55))'
              : 'drop-shadow(0 6px 16px rgba(120, 100, 180, 0.15))',
          transition: 'filter 350ms ease',
        }}
        aria-label={`${gender === 'female' ? 'Female' : 'Male'} AI Companion Avatar (${expression})`}
      >
        <defs>
          {/* Ambient Glow Aura */}
          <radialGradient id="humanAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9D8DF1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#78C6F1" stopOpacity="0" />
          </radialGradient>

          {/* Skin Tones - Soft Warm Pastel */}
          <linearGradient id="humanSkin" x1="0" y1="30" x2="0" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2E8" />
            <stop offset="100%" stopColor="#FDE3D3" />
          </linearGradient>

          {/* Female Hair Tones */}
          <linearGradient id="femaleHair" x1="0" y1="10" x2="0" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6C4E3D" />
            <stop offset="100%" stopColor="#4A3428" />
          </linearGradient>

          {/* Male Hair Tones */}
          <linearGradient id="maleHair" x1="0" y1="10" x2="0" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3E3430" />
            <stop offset="100%" stopColor="#251F1C" />
          </linearGradient>

          {/* Clothes Tones */}
          <linearGradient id="clothingGrad" x1="0" y1="110" x2="140" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9D8DF1" />
            <stop offset="100%" stopColor="#78C6F1" />
          </linearGradient>
        </defs>

        {/* Ambient Halo */}
        <circle cx="70" cy="72" r="66" fill="url(#humanAura)" />

        {/* Back Hair for Female */}
        {isFemale && (
          <path
            d="M 32 60 C 24 85 26 112 40 128 C 48 132 58 132 62 128 C 42 110 40 85 45 60 Z"
            fill="url(#femaleHair)"
          />
        )}
        {isFemale && (
          <path
            d="M 108 60 C 116 85 114 112 100 128 C 92 132 82 132 78 128 C 98 110 100 85 95 60 Z"
            fill="url(#femaleHair)"
          />
        )}

        {/* Neck */}
        <path d="M 60 98 L 60 118 L 80 118 L 80 98 Z" fill="#FADAC7" />

        {/* Shoulders & Clothing */}
        <path
          d="M 28 150 C 28 128 48 116 70 116 C 92 116 112 128 112 150 Z"
          fill="url(#clothingGrad)"
        />
        {/* Soft Collar Accent */}
        <path
          d="M 58 116 Q 70 126 82 116"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          opacity="0.8"
        />

        {/* Head Base / Face */}
        <path
          d="M 38 60 C 38 38 52 32 70 32 C 88 32 102 38 102 60 C 102 85 88 104 70 104 C 52 104 38 85 38 60 Z"
          fill="url(#humanSkin)"
        />

        {/* Ears */}
        <ellipse cx="36" cy="67" rx="4.5" ry="7.5" fill="#FADAC7" />
        <ellipse cx="104" cy="67" rx="4.5" ry="7.5" fill="#FADAC7" />
        {isFemale && (
          <>
            {/* Soft Pearl Earrings for Female */}
            <circle cx="36" cy="74" r="2.2" fill="#FFFFFF" />
            <circle cx="104" cy="74" r="2.2" fill="#FFFFFF" />
          </>
        )}

        {/* Soft Cheeks / Blush */}
        <ellipse cx="46" cy="74" rx="6.5" ry="3.5" fill="#FA9F7A" fillOpacity="0.45" />
        <ellipse cx="94" cy="74" rx="6.5" ry="3.5" fill="#FA9F7A" fillOpacity="0.45" />

        {/* Soft Nose */}
        <path
          d="M 70 66 Q 68 73 70 75 Q 72 75 73 74"
          fill="none"
          stroke="#E0AC93"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Eyebrows */}
        {renderEyebrows()}

        {/* Eyes */}
        {renderEyes()}

        {/* Mouth */}
        {renderMouth()}

        {/* Front Hair - Female Style */}
        {isFemale && (
          <path
            d="M 34 52 C 34 32 48 18 70 18 C 92 18 106 32 106 52 C 104 44 94 36 78 36 C 62 36 46 42 42 50 C 40 52 36 56 34 52 Z"
            fill="url(#femaleHair)"
          />
        )}
        {isFemale && (
          <path
            d="M 36 50 Q 44 38 60 38 Q 48 46 42 62 Z"
            fill="url(#femaleHair)"
          />
        )}

        {/* Front Hair - Male Style */}
        {!isFemale && (
          <path
            d="M 34 54 C 34 30 46 16 70 16 C 94 16 106 28 106 48 C 102 36 90 28 72 28 C 54 28 42 36 34 54 Z"
            fill="url(#maleHair)"
          />
        )}
        {!isFemale && (
          <path
            d="M 40 40 Q 56 24 78 26 Q 64 34 50 36 Z"
            fill="url(#maleHair)"
          />
        )}
      </svg>
    </div>
  );
};
