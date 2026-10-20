/**
 * AI Friend Design Tokens
 * Single source of truth for visual tokens across Web, Mobile & Audio Visualization
 */

export const tokens = {
  colors: {
    // Brand & Companion Core
    primary: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6', // Core Brand Teal
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
    },
    // Warm Accent
    amber: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      300: '#FCD34D',
      500: '#F59E0B',
      600: '#D97706',
    },
    // Dark Canvas Neutrals (Low Arousal Dark Mode)
    dark: {
      canvas: '#0B0F19',
      surface: '#131B2E',
      surfaceElevated: '#1E293B',
      surfaceBorder: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
    },
    // Light Canvas Neutrals
    light: {
      canvas: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#F1F5F9',
      surfaceBorder: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
    },
    // Emotion State Mappings (Attuned ambient colors)
    emotions: {
      neutral: {
        hex: '#94A3B8',
        glow: 'rgba(148, 163, 184, 0.35)',
        label: 'Balanced & Grounded',
      },
      happy: {
        hex: '#FBBF24',
        glow: 'rgba(251, 191, 36, 0.4)',
        label: 'Warm & Uplifted',
      },
      sad: {
        hex: '#60A5FA',
        glow: 'rgba(96, 165, 250, 0.35)',
        label: 'Compassionate & Reflective',
      },
      angry: {
        hex: '#818CF8', // Soothing cooling indigo
        glow: 'rgba(129, 140, 248, 0.4)',
        label: 'Cooling & Patient',
      },
      anxious: {
        hex: '#34D399', // Grounding biophilic emerald
        glow: 'rgba(52, 211, 153, 0.4)',
        label: 'Sanctuary & Reassuring',
      },
      surprised: {
        hex: '#A78BFA',
        glow: 'rgba(167, 139, 250, 0.4)',
        label: 'Curious & Sparkling',
      },
    },
    // Strict Safety / Crisis
    safety: {
      crisisRed: '#EF4444',
      crisisBg: '#7F1D1D',
      crisisBorder: '#F87171',
    },
  },
  typography: {
    fontFamilies: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 1.75,
    },
  },
  spacing: {
    1: '0.25rem', // 4px
    2: '0.5rem',  // 8px
    3: '0.75rem', // 12px
    4: '1rem',    // 16px
    6: '1.5rem',  // 24px
    8: '2rem',    // 32px
    12: '3rem',   // 48px
  },
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.5rem',// 24px
    full: '9999px',
  },
  elevation: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    glow: '0 0 24px -2px var(--current-emotion-glow)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  },
  animation: {
    easing: {
      natural: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    durations: {
      fast: '150ms',
      normal: '300ms',
      slow: '600ms',
      breathing: '4000ms',
    },
  },
} as const;

export type DesignTokens = typeof tokens;
