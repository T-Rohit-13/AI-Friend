/**
 * Centralized Internationalization (i18n) for AI Friend
 * Supports English ('en') and Tamil ('ta') with complete UI localization.
 */

export type SupportedLanguage = 'en' | 'ta';

export const translations = {
  en: {
    // Brand & Header
    appName: 'AI Friend',
    tagline: 'Emotional Companion',
    guestUser: 'Friend',
    signIn: 'Sign In',
    logout: 'Logout',

    // Navigation Tabs
    tabChat: 'Chat',
    tabVoice: 'Voice Call',
    tabGames: 'Riddles & Games',
    tabStudy: 'Study Coach',
    tabMemories: 'Memory Vault',

    // Chat Interface
    chatWelcomeTitle: 'Welcome to your quiet space',
    chatWelcomeSubtitle: "I'm an AI companion here to listen with empathy, share lighthearted moments, tutor study topics, or simply keep you company.",
    inputPlaceholder: "Share what's on your mind, ask for a riddle, or request study help...",
    sendButton: 'Send',
    speakingState: 'AI Friend is speaking...',
    thinkingState: 'AI Friend is reflecting...',
    listeningState: 'Listening...',
    tapToSpeak: 'Tap to speak',
    listeningTamilHint: 'Speak in Tamil (தமிழ்)',
    listeningEnglishHint: 'Speak in English',
    speechErrorMicDenied: 'Microphone permission blocked. Please allow mic access.',
    speechErrorNetwork: 'Network error with speech recognition.',
    speechNoAudio: 'No clear speech detected. Please speak again.',
    readAloud: 'Listen',
    stopAudio: 'Stop',
    replayAudio: 'Replay',
    autoPlayAudio: 'Auto-play voice',

    // Suggestions
    suggestions: [
      'Play Rock Paper Scissors with me! ✂️',
      "I'm feeling down and need some friendly cheer 💙",
      'Tell me a funny joke! 😄',
      'Tell me an interesting riddle 🧩',
      'Explain quantum computing like I am 10 🚀',
      'What is a fascinating fact about nature? 🌿',
    ],

    // Emotions
    emotionWarm: 'Warm',
    emotionPeaceful: 'Peaceful',
    emotionCompassionate: 'Compassionate',
    emotionCelebratory: 'Celebratory',
    emotionGrounded: 'Grounded',
    emotionPlayful: 'Playful',
    emotionNeutral: 'Calm',

    // Settings
    settingsTitle: 'Settings & Accessibility',
    languageSetting: 'App Language',
    highContrast: 'High Contrast Mode',
    muteVoice: 'Mute Companion Voice',
  },
  ta: {
    // Brand & Header
    appName: 'AI Friend',
    tagline: 'உணர்வு தோழன்',
    guestUser: 'தோழர்',
    signIn: 'உள்நுழையவும்',
    logout: 'வெளியேறு',

    // Navigation Tabs
    tabChat: 'அரட்டை',
    tabVoice: 'குரல் அழைப்பு',
    tabGames: 'விடுகதைகள் & விளையாட்டுகள்',
    tabStudy: 'படிப்பு வழிகாட்டி',
    tabMemories: 'நினைவக பெட்டகம்',

    // Chat Interface
    chatWelcomeTitle: 'உங்கள் அமைதியான இடத்திற்கு நல்வரவு',
    chatWelcomeSubtitle: 'பரிவுடன் செவிமடுக்க, மகிழ்ச்சியைப் பகிர்ந்து கொள்ள, புதிய விஷயங்களை எளிமையாகக் கற்பிக்க நான் எப்போதும் உங்களுடன் இருக்கிறேன்.',
    inputPlaceholder: 'உங்கள் மனதில் உள்ளதை பகிருங்கள், விடுகதை கேளுங்கள் அல்லது படியுங்கள்...',
    sendButton: 'அனுப்பு',
    speakingState: 'AI Friend பேசுகிறது...',
    thinkingState: 'AI Friend யோசிக்கிறது...',
    listeningState: 'கேட்கிறது...',
    tapToSpeak: 'பேச தொடங்குங்கள்',
    listeningTamilHint: 'தமிழில் பேசுங்கள் (தமிழ் பேச்சுணர்தல் இயக்கத்தில் உள்ளது)',
    listeningEnglishHint: 'ஆங்கிலத்தில் பேசுங்கள்',
    speechErrorMicDenied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. அமைப்புகளில் அனுமதிக்கவும்.',
    speechErrorNetwork: 'பேச்சுணர்தலில் பிணையப் பிழை ஏற்பட்டது.',
    speechNoAudio: 'குரல் தெளிவாகக் கேட்கவில்லை. தயவுசெய்து மீண்டும் பேசவும்.',
    readAloud: 'கேள்',
    stopAudio: 'நிறுத்து',
    replayAudio: 'மீண்டும் கேள்',
    autoPlayAudio: 'தானியங்கி குரல் இயக்கம்',

    // Suggestions
    suggestions: [
      'கல் காகிதம் கத்தரிக்கோல் விளையாடுவோமா! ✂️',
      'மனம் சோர்வாக உள்ளது, ஆறுதல் கூறுங்கள் 💙',
      'ஒரு வேடிக்கையான விடுகதை சொல் 🧩',
      'ஒரு நகைச்சுவை கூறுங்கள் 😄',
      'எளிமையாக ஒரு புதிய விஷயம் கற்றுக்கொடுங்கள் 🚀',
      'வணக்கம், இன்று எப்படி இருக்கிறீர்கள்? ✨',
    ],

    // Emotions
    emotionWarm: 'அன்பான',
    emotionPeaceful: 'அமைதியான',
    emotionCompassionate: 'பரிவான',
    emotionCelebratory: 'மகிழ்ச்சியான',
    emotionGrounded: 'ஆறுதலான',
    emotionPlayful: 'துடிப்பான',
    emotionNeutral: 'அமைதியான',

    // Settings
    settingsTitle: 'அமைப்புகள் & அணுகல்தன்மை',
    languageSetting: 'பயன்பாட்டு மொழி',
    highContrast: 'உயர் மாறுபட்ட பயன்முறை (High Contrast)',
    muteVoice: 'குரலை முடக்கு (Mute Voice)',
  },
};

export const getSavedLanguage = (): SupportedLanguage => {
  const saved = localStorage.getItem('aifriend_language');
  return saved === 'ta' ? 'ta' : 'en';
};

export const saveLanguage = (lang: SupportedLanguage): void => {
  localStorage.setItem('aifriend_language', lang);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    if (lang === 'ta') {
      document.documentElement.classList.add('tamil-mode');
    } else {
      document.documentElement.classList.remove('tamil-mode');
    }
  }
};
