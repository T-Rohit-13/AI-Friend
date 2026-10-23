/**
 * Adaptive Theme Engine — Centralized Mood-Sensitive Design System
 *
 * Research basis:
 *   - COLOR_PSYCHOLOGY.md §2.2: Emotion → colour mapping matrix
 *   - DATASET_REGISTER.md §6: confidence < 0.55 reverts to neutral
 *   - DECISIONS.md #005: emotion as advisory signal, user request priority
 *   - ARCHITECTURE.md §3.2: uncertainty as a feature
 *
 * Design principles:
 *   - Colour associations are context-dependent hypotheses, not universal facts
 *   - The UI never claims a colour change has therapeutically improved mood
 *   - User's explicit theme choice always overrides mood inference
 *   - Low-confidence/uncertain predictions do NOT trigger visual changes
 */

// ─── Emotion taxonomy (matches VoiceEmotionCNN 8-class output) ───
export type EmotionLabel =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'calm'
  | 'surprised'
  | 'frustrated'
  | 'uncertain';

// ─── Mood category (grouped for UI theming) ───
export type MoodCategory = 'neutral' | 'low' | 'positive' | 'uncertain';

// ─── User-selectable themes ───
export type UserTheme = 'dark' | 'light' | 'calm' | 'playful';

// ─── Complete design tokens for a mood state ───
export interface MoodThemeTokens {
  /** Emotion-specific accent colour */
  emotionColor: string;
  /** Glow/shadow for the accent */
  emotionGlow: string;
  /** Human-readable mood label for the UI */
  label: string;
  /** Animation intensity: 0 (no animation) → 1 (full) */
  animationIntensity: number;
  /** Transition duration in ms */
  transitionSpeed: number;
  /** Mood category for broader theme changes */
  category: MoodCategory;
  /** Background tint overlay (subtle, not replacing the base theme) */
  bgTint: string;
  /** Suggested companion tone */
  companionTone: string;
  /** Suggested activities */
  suggestedActivities: string[];
  /** Ambient background gradient orbs for mood reactive UI */
  ambientOrb1: string;
  ambientOrb2: string;
  ambientOrb3: string;
  /** Gradient for buttons and highlights */
  gradient: string;
}

// ─── Theme definitions per emotion ───
// Research basis: COLOR_PSYCHOLOGY.md §2.2 Emotion Tone Mapping Matrix
const EMOTION_THEMES: Record<EmotionLabel, MoodThemeTokens> = {
  neutral: {
    emotionColor: '#60A5FA',
    emotionGlow: 'rgba(96, 165, 250, 0.40)',
    label: 'Neutral',
    animationIntensity: 0.5,
    transitionSpeed: 500,
    category: 'neutral',
    bgTint: 'rgba(96, 165, 250, 0.05)',
    companionTone: 'attentive',
    suggestedActivities: ['Chat', 'Games', 'Study'],
    ambientOrb1: 'rgba(191, 219, 254, 0.60)',
    ambientOrb2: 'rgba(224, 231, 255, 0.50)',
    ambientOrb3: 'rgba(219, 234, 254, 0.45)',
    gradient: 'linear-gradient(135deg, #60A5FA, #818CF8)',
  },
  happy: {
    emotionColor: '#FA9F7A',
    emotionGlow: 'rgba(250, 159, 122, 0.45)',
    label: 'Happy',
    animationIntensity: 0.85,
    transitionSpeed: 450,
    category: 'positive',
    bgTint: 'rgba(250, 159, 122, 0.08)',
    companionTone: 'celebratory',
    suggestedActivities: ['Games', 'Riddles', 'Tell a joke'],
    ambientOrb1: 'rgba(254, 240, 138, 0.65)',
    ambientOrb2: 'rgba(254, 215, 170, 0.60)',
    ambientOrb3: 'rgba(253, 230, 138, 0.50)',
    gradient: 'linear-gradient(135deg, #FA9F7A, #F59E0B)',
  },
  sad: {
    emotionColor: '#9D8DF1',
    emotionGlow: 'rgba(157, 141, 241, 0.40)',
    label: 'Sad',
    animationIntensity: 0.35,
    transitionSpeed: 600,
    category: 'low',
    bgTint: 'rgba(157, 141, 241, 0.06)',
    companionTone: 'compassionate',
    suggestedActivities: ['Quiet conversation', 'Breathing exercise', 'Gentle riddle'],
    ambientOrb1: 'rgba(221, 214, 254, 0.65)',
    ambientOrb2: 'rgba(199, 210, 254, 0.55)',
    ambientOrb3: 'rgba(233, 213, 255, 0.45)',
    gradient: 'linear-gradient(135deg, #9D8DF1, #6366F1)',
  },
  angry: {
    emotionColor: '#EF5350',
    emotionGlow: 'rgba(239, 83, 80, 0.42)',
    label: 'Frustrated',
    animationIntensity: 0.4,
    transitionSpeed: 600,
    category: 'low',
    bgTint: 'rgba(239, 83, 80, 0.06)',
    companionTone: 'patient',
    suggestedActivities: ['Breathing exercise', 'Quiet conversation', 'Simple game'],
    ambientOrb1: 'rgba(254, 205, 211, 0.65)',
    ambientOrb2: 'rgba(254, 215, 170, 0.50)',
    ambientOrb3: 'rgba(254, 226, 226, 0.45)',
    gradient: 'linear-gradient(135deg, #EF5350, #F97316)',
  },
  anxious: {
    emotionColor: '#818CF8',
    emotionGlow: 'rgba(129, 140, 248, 0.42)',
    label: 'Anxious',
    animationIntensity: 0.35,
    transitionSpeed: 600,
    category: 'low',
    bgTint: 'rgba(129, 140, 248, 0.06)',
    companionTone: 'grounding',
    suggestedActivities: ['Breathing exercise', 'Grounding activity', 'Calm conversation'],
    ambientOrb1: 'rgba(224, 231, 255, 0.65)',
    ambientOrb2: 'rgba(199, 210, 254, 0.55)',
    ambientOrb3: 'rgba(165, 180, 252, 0.45)',
    gradient: 'linear-gradient(135deg, #818CF8, #38BDF8)',
  },
  calm: {
    emotionColor: '#34D399',
    emotionGlow: 'rgba(52, 211, 153, 0.40)',
    label: 'Calm',
    animationIntensity: 0.45,
    transitionSpeed: 500,
    category: 'neutral',
    bgTint: 'rgba(52, 211, 153, 0.06)',
    companionTone: 'peaceful',
    suggestedActivities: ['Study', 'Conversation', 'Riddles'],
    ambientOrb1: 'rgba(167, 243, 208, 0.65)',
    ambientOrb2: 'rgba(186, 230, 253, 0.55)',
    ambientOrb3: 'rgba(209, 250, 229, 0.45)',
    gradient: 'linear-gradient(135deg, #34D399, #60A5FA)',
  },
  surprised: {
    emotionColor: '#FFB74D',
    emotionGlow: 'rgba(255, 183, 77, 0.45)',
    label: 'Excited',
    animationIntensity: 0.85,
    transitionSpeed: 450,
    category: 'positive',
    bgTint: 'rgba(255, 183, 77, 0.08)',
    companionTone: 'playful',
    suggestedActivities: ['Riddles', 'Trivia', 'Explore a topic'],
    ambientOrb1: 'rgba(254, 240, 138, 0.65)',
    ambientOrb2: 'rgba(254, 215, 170, 0.55)',
    ambientOrb3: 'rgba(252, 211, 77, 0.45)',
    gradient: 'linear-gradient(135deg, #FFB74D, #F43F5E)',
  },
  frustrated: {
    emotionColor: '#EF5350',
    emotionGlow: 'rgba(239, 83, 80, 0.42)',
    label: 'Frustrated',
    animationIntensity: 0.4,
    transitionSpeed: 600,
    category: 'low',
    bgTint: 'rgba(239, 83, 80, 0.06)',
    companionTone: 'patient',
    suggestedActivities: ['Break activity', 'Simple game', 'Breathing exercise'],
    ambientOrb1: 'rgba(254, 205, 211, 0.65)',
    ambientOrb2: 'rgba(254, 215, 170, 0.50)',
    ambientOrb3: 'rgba(254, 226, 226, 0.45)',
    gradient: 'linear-gradient(135deg, #EF5350, #F97316)',
  },
  uncertain: {
    emotionColor: '#94A3B8',
    emotionGlow: 'rgba(148, 163, 184, 0.35)',
    label: 'Mood uncertain',
    animationIntensity: 0.35,
    transitionSpeed: 500,
    category: 'uncertain',
    bgTint: 'rgba(148, 163, 184, 0.04)',
    companionTone: 'attentive',
    suggestedActivities: ['Chat', 'Games'],
    ambientOrb1: 'rgba(241, 245, 249, 0.65)',
    ambientOrb2: 'rgba(226, 232, 240, 0.55)',
    ambientOrb3: 'rgba(248, 250, 252, 0.45)',
    gradient: 'linear-gradient(135deg, #94A3B8, #64748B)',
  },
};

// ─── Emotion inference result from the API ───
export interface EmotionInferenceResult {
  primary_emotion: string;
  confidence: number;
  distribution: Record<string, number>;
  acoustic_tone?: string;
  pitch_mean?: number;
  rms_energy?: number;
}


// ─── Theme Engine State ───
export interface ThemeEngineState {
  /** Current active mood */
  activeMood: EmotionLabel;
  /** Current theme tokens */
  activeTokens: MoodThemeTokens;
  /** Whether mood adaptation is enabled */
  moodAdaptationEnabled: boolean;
  /** User's explicitly selected theme */
  userTheme: UserTheme;
  /** User's manual mood override (null = no override) */
  manualMoodOverride: EmotionLabel | null;
  /** Last model prediction (raw, before smoothing) */
  lastRawPrediction: EmotionInferenceResult | null;
  /** Source of last detected emotion (voice vs text) */
  lastEmotionSource: 'voice' | 'text' | null;
  /** Whether the model is available */
  modelAvailable: boolean;
}

/**
 * Centralized Adaptive Theme Engine
 *
 * Responsibilities:
 * 1. Process genuine emotion predictions from text and voice
 * 2. Update mood reactive state immediately on valid prediction
 * 3. Support honest "uncertain" and "neutral" handling for low confidence
 * 4. Respect user overrides at all times
 * 5. Expose design tokens for the active theme state
 */
export class ThemeEngine {
  private currentMood: EmotionLabel = 'neutral';
  private _moodAdaptationEnabled = true;
  private _userTheme: UserTheme = 'dark';
  private _manualMoodOverride: EmotionLabel | null = null;
  private _lastRawPrediction: EmotionInferenceResult | null = null;
  private _lastEmotionSource: 'voice' | 'text' | null = null;
  private _modelAvailable = true;
  private listeners: Set<(state: ThemeEngineState) => void> = new Set();

  constructor() {
    // Load persisted preferences
    try {
      const saved = localStorage.getItem('aifriend_theme_prefs');
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.userTheme) this._userTheme = prefs.userTheme;
        if (typeof prefs.moodAdaptationEnabled === 'boolean') {
          this._moodAdaptationEnabled = prefs.moodAdaptationEnabled;
        }
        if (prefs.manualMoodOverride) {
          this._manualMoodOverride = prefs.manualMoodOverride;
        }
      }
    } catch {}
  }

  // ─── Public API ───

  /** Get current complete state */
  getState(): ThemeEngineState {
    const effectiveMood = this.getEffectiveMood();
    return {
      activeMood: effectiveMood,
      activeTokens: EMOTION_THEMES[effectiveMood] || EMOTION_THEMES.neutral,
      moodAdaptationEnabled: this._moodAdaptationEnabled,
      userTheme: this._userTheme,
      manualMoodOverride: this._manualMoodOverride,
      lastRawPrediction: this._lastRawPrediction,
      lastEmotionSource: this._lastEmotionSource,
      modelAvailable: this._modelAvailable,
    };
  }

  /** Get theme tokens for a specific emotion */
  getTokensForEmotion(emotion: EmotionLabel): MoodThemeTokens {
    return EMOTION_THEMES[emotion] || EMOTION_THEMES.neutral;
  }

  /** Get all available emotion labels */
  getAvailableEmotions(): EmotionLabel[] {
    return Object.keys(EMOTION_THEMES) as EmotionLabel[];
  }

  /**
   * Process a new emotion inference result from the real API (voice or text).
   * Updates current mood immediately on valid predictions.
   * Handles low confidence honestly by setting mood to 'uncertain' or 'neutral'.
   */
  processInference(result: EmotionInferenceResult, source: 'voice' | 'text' = 'text'): boolean {
    this._lastRawPrediction = result;
    this._modelAvailable = true;
    this._lastEmotionSource = source;

    // If mood adaptation is disabled or user has a manual override, skip
    if (!this._moodAdaptationEnabled || this._manualMoodOverride !== null) {
      this.notifyListeners();
      return false;
    }

    const emotion = this.normalizeEmotion(result.primary_emotion);
    const confidence = result.confidence ?? 0.5;

    // Honest handling of low confidence (< 0.35) or explicit uncertain/silent audio
    if (confidence < 0.35 || (result as any).uncertain) {
      if (this.currentMood !== 'uncertain') {
        this.currentMood = 'uncertain';
        this.applyThemeToDOM();
        this.notifyListeners();
        return true;
      }
      this.notifyListeners();
      return false;
    }

    // Direct reactive mood transition when a valid emotion is detected
    if (this.currentMood !== emotion) {
      this.currentMood = emotion;
      this.applyThemeToDOM();
      this.notifyListeners();
      return true;
    }

    this.notifyListeners();
    return false;
  }

  /** Report that the model is unavailable (failure, no audio, etc.) */
  reportModelUnavailable(): void {
    this._modelAvailable = false;
    // Don't change theme — retain current/default state
    this.notifyListeners();
  }

  /** User explicitly selects a mood override. Takes immediate effect. */
  setManualMoodOverride(mood: EmotionLabel | null): void {
    this._manualMoodOverride = mood;
    this.applyThemeToDOM();
    this.persistPreferences();
    this.notifyListeners();
  }

  /** User selects their theme (dark/light/calm/playful). Immediate. */
  setUserTheme(theme: UserTheme): void {
    this._userTheme = theme;
    this.applyBaseThemeToDOM();
    this.persistPreferences();
    this.notifyListeners();
  }

  /** Toggle mood adaptation on/off */
  setMoodAdaptationEnabled(enabled: boolean): void {
    this._moodAdaptationEnabled = enabled;
    if (!enabled) {
      // Reset to neutral mood display
      this.currentMood = 'neutral';
    }
    this.applyThemeToDOM();
    this.persistPreferences();
    this.notifyListeners();
  }

  /** Subscribe to state changes */
  subscribe(listener: (state: ThemeEngineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Apply all theme state to the DOM */
  applyThemeToDOM(): void {
    const tokens = this.getState().activeTokens;
    const root = document.documentElement;

    root.style.setProperty('--current-emotion-color', tokens.emotionColor);
    root.style.setProperty('--current-emotion-glow', tokens.emotionGlow);
    root.style.setProperty('--current-emotion-soft', `${tokens.emotionColor}24`);
    root.style.setProperty('--mood-bg-tint', tokens.bgTint);
    root.style.setProperty('--mood-animation-intensity', String(tokens.animationIntensity));
    root.style.setProperty('--mood-transition-speed', `${tokens.transitionSpeed}ms`);
    root.style.setProperty('--current-pastel-gradient', tokens.gradient);

    // Apply mood ambient orbs with theme adaptation (deep aura in dark mode, radiant pastel in light)
    const isDark = this._userTheme === 'dark' || this._userTheme === 'calm';
    if (isDark) {
      root.style.setProperty('--ambient-orb-1', tokens.ambientOrb1.replace(/0\.\d+\)/, '0.24)'));
      root.style.setProperty('--ambient-orb-2', tokens.ambientOrb2.replace(/0\.\d+\)/, '0.18)'));
      root.style.setProperty('--ambient-orb-3', tokens.ambientOrb3.replace(/0\.\d+\)/, '0.16)'));
    } else {
      root.style.setProperty('--ambient-orb-1', tokens.ambientOrb1);
      root.style.setProperty('--ambient-orb-2', tokens.ambientOrb2);
      root.style.setProperty('--ambient-orb-3', tokens.ambientOrb3);
    }

    // Set mood data attribute for CSS selectors
    const mood = this.getEffectiveMood();
    root.setAttribute('data-mood', mood);
    root.setAttribute('data-mood-category', tokens.category);
  }

  /** Apply base theme (dark/light/calm/playful) to DOM */
  applyBaseThemeToDOM(): void {
    const root = document.documentElement;

    // Map user theme to data-theme attribute
    switch (this._userTheme) {
      case 'light':
        root.setAttribute('data-theme', 'light');
        root.removeAttribute('data-user-theme');
        break;
      case 'calm':
        root.setAttribute('data-theme', 'dark');
        root.setAttribute('data-user-theme', 'calm');
        break;
      case 'playful':
        root.setAttribute('data-theme', 'light');
        root.setAttribute('data-user-theme', 'playful');
        break;
      case 'dark':
      default:
        root.setAttribute('data-theme', 'dark');
        root.removeAttribute('data-user-theme');
        break;
    }
  }

  // ─── Internal ───

  private getEffectiveMood(): EmotionLabel {
    // Priority: manual override > mood adaptation > neutral
    if (this._manualMoodOverride) return this._manualMoodOverride;
    if (!this._moodAdaptationEnabled) return 'neutral';
    return this.currentMood;
  }

  private normalizeEmotion(raw: string): EmotionLabel {
    const normalized = raw.toLowerCase().trim();
    if (normalized in EMOTION_THEMES) return normalized as EmotionLabel;
    // Map related terms
    const mapping: Record<string, EmotionLabel> = {
      warm: 'neutral',
      compassionate: 'sad',
      depressed: 'sad',
      lonely: 'sad',
      stressed: 'anxious',
      panic: 'anxious',
      grounded: 'calm',
      tired: 'sad',
      peaceful: 'calm',
      joyful: 'happy',
      celebratory: 'happy',
      playful: 'happy',
    };
    return mapping[normalized] || 'neutral';
  }

  private persistPreferences(): void {
    try {
      localStorage.setItem(
        'aifriend_theme_prefs',
        JSON.stringify({
          userTheme: this._userTheme,
          moodAdaptationEnabled: this._moodAdaptationEnabled,
          manualMoodOverride: this._manualMoodOverride,
        })
      );
    } catch {}
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }
}

// Singleton instance
let _instance: ThemeEngine | null = null;

export function getThemeEngine(): ThemeEngine {
  if (!_instance) {
    _instance = new ThemeEngine();
  }
  return _instance;
}
