/**
 * Avatar Preferences and Persistence Service
 * Manages user companion avatar style (Emoji vs Human-Like), character gender, and voice pairings.
 */

export type AvatarStyle = 'emoji';
export type CharacterGender = 'female' | 'male';

export interface AvatarPreferences {
  style: AvatarStyle;
  gender: CharacterGender;
  companionName: string;
  voiceId?: string; // Optional custom voice override
  autoMoodEnabled: boolean;
  gentleAcknowledgements: boolean;
  avatarMoodOverride?: string;
  conversationMode: 'normal' | 'dump';
  emotionSharingOptIn: boolean;
  privacyStrictMode: boolean;
}

const STORAGE_KEY = 'ai_friend_avatar_preferences_v4';

export const DEFAULT_AVATAR_PREFERENCES: AvatarPreferences = {
  style: 'emoji', // Animated Emoji Companion Avatar
  gender: 'female',
  companionName: 'AI-Friend',
  autoMoodEnabled: true,
  gentleAcknowledgements: true,
  avatarMoodOverride: 'auto',
  conversationMode: 'normal',
  emotionSharingOptIn: true,
  privacyStrictMode: false,
};

export function getAvatarPreferences(): AvatarPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ai_friend_avatar_preferences_v2');
    if (!raw) return { ...DEFAULT_AVATAR_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      style: 'emoji',
      gender: parsed.gender === 'male' ? 'male' : 'female',
      companionName: parsed.companionName || 'AI-Friend',
      voiceId: parsed.voiceId || undefined,
      autoMoodEnabled: parsed.autoMoodEnabled !== false,
      gentleAcknowledgements: parsed.gentleAcknowledgements !== false,
      avatarMoodOverride: parsed.avatarMoodOverride || 'auto',
      conversationMode: parsed.conversationMode === 'dump' ? 'dump' : 'normal',
      emotionSharingOptIn: parsed.emotionSharingOptIn !== false,
      privacyStrictMode: Boolean(parsed.privacyStrictMode),
    };
  } catch {
    return { ...DEFAULT_AVATAR_PREFERENCES };
  }
}

export function saveAvatarPreferences(prefs: Partial<AvatarPreferences>): AvatarPreferences {
  const current = getAvatarPreferences();
  const updated: AvatarPreferences = {
    ...current,
    ...prefs,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event so all active avatar instances sync immediately
    window.dispatchEvent(new CustomEvent('ai_friend_avatar_prefs_changed', { detail: updated }));
  } catch (err) {
    console.warn('Failed to save avatar preferences:', err);
  }
  return updated;
}

/**
 * Returns the recommended TTS voice based on selected character gender and language.
 */
export function getRecommendedVoice(gender: CharacterGender, language: string, customVoiceId?: string): string {
  if (customVoiceId) return customVoiceId;

  const isTamil = language === 'ta' || language.startsWith('ta');
  if (isTamil) {
    return gender === 'male' ? 'ta-IN-ValluvarNeural' : 'ta-IN-PallaviNeural';
  }

  // English
  return gender === 'male' ? 'en-US-GuyNeural' : 'en-US-JennyNeural';
}
