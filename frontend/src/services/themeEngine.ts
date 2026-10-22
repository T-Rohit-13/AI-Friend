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
  | 'frustrated';

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
}

// ─── Theme definitions per emotion ───
// Research basis: COLOR_PSYCHOLOGY.md §2.2 Emotion Tone Mapping Matrix
// NOTE: These colour choices are design hypotheses informed by research,
// not claims that colours reliably change a person's mood.
const EMOTION_THEMES: Record<EmotionLabel, MoodThemeTokens> = {
  neutral: {
    emotionColor: '#78C6F1',
    emotionGlow: 'rgba(120, 198, 241, 0.35)',
    label: 'Balanced & Peaceful',
    animationIntensity: 0.5,
    transitionSpeed: 600,
    category: 'neutral',
    bgTint: 'rgba(120, 198, 241, 0.04)',
    companionTone: 'warm',
    suggestedActivities: ['Chat', 'Games', 'Study'],
  },
  happy: {
    emotionColor: '#FA9F7A',
    emotionGlow: 'rgba(250, 159, 122, 0.38)',
    label: 'Joyful & Vibrant',
    animationIntensity: 0.85,
    transitionSpeed: 500,
    category: 'positive',
    bgTint: 'rgba(250, 159, 122, 0.05)',
    companionTone: 'celebratory',
    suggestedActivities: ['Games', 'Riddles', 'Tell a joke'],
  },
  sad: {
    emotionColor: '#9D8DF1',
    emotionGlow: 'rgba(157, 141, 241, 0.35)',
    label: 'Gentle Support',
    animationIntensity: 0.35,
    transitionSpeed: 800,
    category: 'low',
    bgTint: 'rgba(157, 141, 241, 0.04)',
    companionTone: 'compassionate',
    suggestedActivities: ['Quiet conversation', 'Breathing exercise', 'Gentle riddle'],
  },
  angry: {
    emotionColor: '#9D8DF1',
    emotionGlow: 'rgba(157, 141, 241, 0.35)',
    label: 'Cooling Safe Space',
    animationIntensity: 0.35,
    transitionSpeed: 700,
    category: 'low',
    bgTint: 'rgba(157, 141, 241, 0.04)',
    companionTone: 'calm',
    suggestedActivities: ['Breathing exercise', 'Quiet conversation', 'Simple game'],
  },
  anxious: {
    emotionColor: '#63D8A5',
    emotionGlow: 'rgba(99, 216, 165, 0.35)',
    label: 'Soothing Grounding',
    animationIntensity: 0.3,
    transitionSpeed: 800,
    category: 'low',
    bgTint: 'rgba(99, 216, 165, 0.04)',
    companionTone: 'grounding',
    suggestedActivities: ['Breathing exercise', 'Grounding activity', 'Calm conversation'],
  },
  calm: {
    emotionColor: '#63D8A5',
    emotionGlow: 'rgba(99, 216, 165, 0.35)',
    label: 'Peaceful Calm',
    animationIntensity: 0.45,
    transitionSpeed: 700,
    category: 'neutral',
    bgTint: 'rgba(99, 216, 165, 0.04)',
    companionTone: 'warm',
    suggestedActivities: ['Study', 'Conversation', 'Riddles'],
  },
  surprised: {
    emotionColor: '#B8ACF6',
    emotionGlow: 'rgba(184, 172, 246, 0.38)',
    label: 'Curious Wonder',
    animationIntensity: 0.75,
    transitionSpeed: 500,
    category: 'positive',
    bgTint: 'rgba(184, 172, 246, 0.05)',
    companionTone: 'playful',
    suggestedActivities: ['Riddles', 'Trivia', 'Explore a topic'],
  },
  frustrated: {
    emotionColor: '#9D8DF1',
    emotionGlow: 'rgba(157, 141, 241, 0.35)',
    label: 'Patient Support',
    animationIntensity: 0.35,
    transitionSpeed: 750,
    category: 'low',
    bgTint: 'rgba(157, 141, 241, 0.04)',
    companionTone: 'patient',
    suggestedActivities: ['Break activity', 'Simple game', 'Breathing exercise'],
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

// ─── Smoothing Configuration ───
const CONFIG = {
  /** Minimum confidence to consider a prediction actionable */
  CONFIDENCE_THRESHOLD: 0.55,
  /** Higher confidence required to switch AWAY from current mood */
  HYSTERESIS_THRESHOLD: 0.65,
  /** Number of consistent readings required before applying a mood change */
  CONSISTENT_READINGS_REQUIRED: 3,
  /** Maximum time window (ms) for consistent readings */
  CONSISTENCY_WINDOW_MS: 15000,
  /** Minimum interval (ms) between theme transitions */
  MIN_TRANSITION_INTERVAL_MS: 5000,
  /** Maximum number of readings to keep in history */
  MAX_HISTORY_SIZE: 10,
} as const;

// ─── Internal tracking state ───
interface PredictionEntry {
  emotion: EmotionLabel;
  confidence: number;
  timestamp: number;
}

// ─── Theme Engine State ───
export interface ThemeEngineState {
  /** Current active mood (after smoothing) */
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
  /** Whether the model is available */
  modelAvailable: boolean;
}

/**
 * Centralized Adaptive Theme Engine
 *
 * Responsibilities:
 * 1. Process emotion predictions with confidence filtering
 * 2. Apply temporal smoothing / hysteresis to prevent flickering
 * 3. Respect user overrides at all times
 * 4. Expose design tokens for the active theme state
 * 5. Never claim therapeutic effect
 */
export class ThemeEngine {
  private predictionHistory: PredictionEntry[] = [];
  private lastTransitionTime = 0;
  private currentMood: EmotionLabel = 'neutral';
  private _moodAdaptationEnabled = true;
  private _userTheme: UserTheme = 'dark';
  private _manualMoodOverride: EmotionLabel | null = null;
  private _lastRawPrediction: EmotionInferenceResult | null = null;
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
   * Process a new emotion inference result from the real API.
   * Applies confidence filtering + temporal smoothing + hysteresis.
   * Returns true if mood actually changed.
   */
  processInference(result: EmotionInferenceResult): boolean {
    this._lastRawPrediction = result;
    this._modelAvailable = true;

    // If mood adaptation is disabled or user has a manual override, skip
    if (!this._moodAdaptationEnabled || this._manualMoodOverride !== null) {
      this.notifyListeners();
      return false;
    }

    const emotion = this.normalizeEmotion(result.primary_emotion);
    const confidence = result.confidence;

    // 1. Confidence gate
    if (confidence < CONFIG.CONFIDENCE_THRESHOLD) {
      // Low confidence → don't change anything
      return false;
    }

    // 2. Hysteresis: require higher confidence to switch away from current
    if (emotion !== this.currentMood && confidence < CONFIG.HYSTERESIS_THRESHOLD) {
      return false;
    }

    // 3. Record prediction
    const now = Date.now();
    this.predictionHistory.push({ emotion, confidence, timestamp: now });

    // Trim old entries
    const cutoff = now - CONFIG.CONSISTENCY_WINDOW_MS;
    this.predictionHistory = this.predictionHistory
      .filter((p) => p.timestamp >= cutoff)
      .slice(-CONFIG.MAX_HISTORY_SIZE);

    // 4. Check temporal consistency
    const recentReadings = this.predictionHistory.filter(
      (p) => p.timestamp >= cutoff && p.emotion === emotion
    );

    if (recentReadings.length < CONFIG.CONSISTENT_READINGS_REQUIRED) {
      // Not enough consistent readings yet
      return false;
    }

    // 5. Debounce: minimum interval between transitions
    if (now - this.lastTransitionTime < CONFIG.MIN_TRANSITION_INTERVAL_MS) {
      return false;
    }

    // 6. Apply mood change
    if (this.currentMood !== emotion) {
      this.currentMood = emotion;
      this.lastTransitionTime = now;
      this.applyThemeToDOM();
      this.notifyListeners();
      return true;
    }

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
      this.predictionHistory = [];
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
    root.style.setProperty('--current-emotion-soft', `${tokens.emotionColor}20`);
    root.style.setProperty('--mood-bg-tint', tokens.bgTint);
    root.style.setProperty('--mood-animation-intensity', String(tokens.animationIntensity));
    root.style.setProperty('--mood-transition-speed', `${tokens.transitionSpeed}ms`);

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
