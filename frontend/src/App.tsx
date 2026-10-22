import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navigation/Navbar';
import type { AppMode } from './components/Navigation/Navbar';
import { EmotionalAvatar } from './components/Avatar/EmotionalAvatar';
import type { CompanionState, AvatarExpression } from './components/Avatar/EmotionalAvatar';
import { DevTestingPanel } from './components/Dev/DevTestingPanel';
import { ChatView } from './components/Chat/ChatView';
import { VoiceControls } from './components/Voice/VoiceControls';
import { GamesView } from './components/Games/GamesView';
import { StudyView } from './components/Study/StudyView';
import { MemoryVaultView } from './components/Memory/MemoryVaultView';
import { AuthModal } from './components/Auth/AuthModal';
import { SettingsPanel } from './components/Navigation/SettingsPanel';
import { MoodActivities } from './components/Navigation/MoodActivities';
import { api } from './services/api';
import type { ChatMessage, UserProfile } from './services/api';
import { getThemeEngine } from './services/themeEngine';
import type { ThemeEngineState } from './services/themeEngine';
import { getSavedLanguage, saveLanguage } from './services/i18n';

export function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('chat');
  const [companionEmotion, setCompanionEmotion] = useState('warm');
  const [companionState, setCompanionState] = useState<CompanionState>('idle');
  const [language, setLanguage] = useState<'en' | 'ta'>(getSavedLanguage());
  const [persona, setPersona] = useState('friendly_companion');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);
  const [audioLoadingMsgId, setAudioLoadingMsgId] = useState<string | null>(null);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [verificationBanner, setVerificationBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Settings & Dev Panel State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [autoMoodEnabled, setAutoMoodEnabled] = useState(true);
  const [manualOverrideEmotion, setManualOverrideEmotion] = useState<AvatarExpression | null>(null);

  // Theme Engine Integration
  const themeEngine = getThemeEngine();
  const [themeState, setThemeState] = useState<ThemeEngineState>(themeEngine.getState());

  const isSpeakingRef = useRef(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // ─── Theme Engine Subscription ───
  useEffect(() => {
    const unsub = themeEngine.subscribe((state) => {
      setThemeState(state);
    });

    // Apply initial theme
    themeEngine.applyBaseThemeToDOM();
    themeEngine.applyThemeToDOM();

    return unsub;
  }, []);

  // High contrast mode attribute
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  }, [isHighContrast]);

  // Check current user session on mount
  useEffect(() => {
    const fetchUser = async () => {
      const u = await api.getMe();
      if (u) setUser(u);
    };
    fetchUser();
  }, []);

  // Global Keyboard Navigation Shortcuts (a11y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setCurrentMode('chat');
        } else if (e.key === '2') {
          e.preventDefault();
          setCurrentMode('voice');
        } else if (e.key === '3') {
          e.preventDefault();
          setCurrentMode('games');
        } else if (e.key === '4') {
          e.preventDefault();
          setCurrentMode('study');
        } else if (e.key === '5') {
          e.preventDefault();
          setCurrentMode('memories');
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setIsHighContrast((prev) => !prev);
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          setIsMuted((prev) => !prev);
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          setIsSettingsOpen((prev) => !prev);
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setIsDevPanelOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic Mood & Emotion Color Mapping
  // Now driven by ThemeEngine — CSS custom properties are set by themeEngine.applyThemeToDOM()
  useEffect(() => {
    themeEngine.applyThemeToDOM();
  }, [themeState.activeMood]);

  // Create initial chat session
  useEffect(() => {
    const initSession = async () => {
      const sess = await api.createSession('AI Friend Session', language, persona);
      setSessionId(sess.id);
    };
    initSession();
  }, [language, persona]);

  // Check for email verification token in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify_token') || params.get('token');
    if (verifyToken) {
      api
        .verifyEmail(verifyToken)
        .then((res) => {
          setVerificationBanner({
            type: 'success',
            text: res.message || 'Email successfully verified! You can now log in.',
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          setVerificationBanner({
            type: 'error',
            text: err.message || 'Verification link is invalid or has expired.',
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  // Barge-In Interrupt Handler
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    isSpeakingRef.current = false;
    setCurrentlySpeakingMsgId(null);
    setCompanionState('idle');
  };

  // Speech Synthesis with genuine Tamil & English voice support
  const speakText = (
    text: string,
    msgId?: string,
    overrideLang?: string,
    directAudioUrl?: string | null
  ) => {
    if (isMuted) return;
    stopSpeaking();
    if (msgId) setCurrentlySpeakingMsgId(msgId);

    const hasTamilUnicode = /[\u0B80-\u0BFF]/.test(text);
    const resolvedLang = overrideLang || (hasTamilUnicode ? 'ta-IN' : (language === 'ta' ? 'ta-IN' : 'en-US'));
    const isTamilSpeech = resolvedLang.startsWith('ta') || hasTamilUnicode;

    if (isTamilSpeech) {
      // 1. Check if browser has a genuine native Tamil voice in Web Speech
      const voices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [];
      const tamilVoice = voices.find(
        (v) =>
          (v.lang && (v.lang.toLowerCase() === 'ta-in' || v.lang.toLowerCase().startsWith('ta-') || v.lang.toLowerCase() === 'ta')) ||
          (v.name && v.name.toLowerCase().includes('tamil')) ||
          (v.name && (v.name.toLowerCase().includes('pallavi') || v.name.toLowerCase().includes('valluvar')))
      );

      if (tamilVoice && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ta-IN';
        utterance.voice = tamilVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          setCompanionState('speaking');
          setAudioLoadingMsgId(null);
        };
        utterance.onend = () => {
          isSpeakingRef.current = false;
          setCurrentlySpeakingMsgId(null);
          setAudioLoadingMsgId(null);
          setCompanionState('idle');
        };
        utterance.onerror = (e) => {
          console.warn('Native Tamil voice error, falling back to neural backend TTS:', e);
          fallbackToBackendTamilAudio(text, msgId, directAudioUrl);
        };
        window.speechSynthesis.speak(utterance);
        return;
      }

      // 2. If browser lacks a native Tamil voice (the common case), stream neural Tamil audio from backend edge-tts/gtts
      fallbackToBackendTamilAudio(text, msgId, directAudioUrl);
      return;
    }

    // Default Web Speech for English
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice =
        voices.find((v) => (v.name.includes('Natural') || v.name.includes('Online')) && v.lang.startsWith('en')) ||
        voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en')) ||
        null;

      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setCompanionState('speaking');
        setAudioLoadingMsgId(null);
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setCurrentlySpeakingMsgId(null);
        setAudioLoadingMsgId(null);
        setCompanionState('idle');
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setCurrentlySpeakingMsgId(null);
        setAudioLoadingMsgId(null);
        setCompanionState('idle');
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const fallbackToBackendTamilAudio = (text: string, msgId?: string, directAudioUrl?: string | null) => {
    try {
      if (msgId) setAudioLoadingMsgId(msgId);
      setCompanionState('speaking');

      const streamUrl = directAudioUrl
        ? (directAudioUrl.startsWith('http') ? directAudioUrl : `${api.getBaseUrl()}${directAudioUrl}`)
        : api.getTtsAudioUrl(text, 'ta-IN');

      const audio = new Audio(streamUrl);
      audioPlayerRef.current = audio;

      audio.onplay = () => {
        isSpeakingRef.current = true;
        setAudioLoadingMsgId(null);
        setCompanionState('speaking');
      };
      audio.onended = () => {
        isSpeakingRef.current = false;
        setCurrentlySpeakingMsgId(null);
        setAudioLoadingMsgId(null);
        setCompanionState('idle');
      };
      audio.onerror = (e) => {
        console.warn('Backend Tamil TTS playback error:', e);
        isSpeakingRef.current = false;
        setCurrentlySpeakingMsgId(null);
        setAudioLoadingMsgId(null);
        setCompanionState('idle');
        setTtsNotice(
          language === 'ta'
            ? 'தமிழ் குரல் ஒலியை இயக்க முடியவில்லை. நெட்வொர்க்கை சரிபார்க்கவும்.'
            : 'Tamil voice playback failed. Please check network connection.'
        );
        setTimeout(() => setTtsNotice(null), 5000);
      };
      audio.play().catch((err) => {
        console.warn('Audio play auto-policy notice (user interaction required):', err);
        setCurrentlySpeakingMsgId(null);
        setAudioLoadingMsgId(null);
        setCompanionState('idle');
      });
    } catch (err) {
      console.warn('Tamil TTS synthesis stream error:', err);
      setCurrentlySpeakingMsgId(null);
      setAudioLoadingMsgId(null);
      setCompanionState('idle');
    }
  };

  // Handle User Message (from Text or Voice)
  const handleSendMessage = async (text: string, voiceEmotion?: string) => {
    if (!text.trim() || isLoading) return;

    stopSpeaking();

    // Optimistic user message insertion
    const tempUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);
    setCompanionState('thinking');

    try {
      const vocalSignal = voiceEmotion || 'neutral';
      const turn = await api.sendMessage(sessionId, text, language, vocalSignal);

      const companionReply: ChatMessage = {
        id: turn.message_id,
        role: 'assistant',
        content: turn.content,
        audio_url: turn.audio_url,
        companion_emotion: turn.companion_emotion,
        detected_emotion: turn.user_emotion,
        safety_notice: turn.safety_notice,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, companionReply]);

      // Automatically sync conversation language if Tamil or English was requested
      const isTurnTamil =
        turn.language === 'ta' ||
        turn.language.startsWith('ta') ||
        /[\u0B80-\u0BFF]/.test(turn.content);

      if (isTurnTamil && language !== 'ta') {
        setLanguage('ta');
        saveLanguage('ta');
      } else if (!isTurnTamil && turn.language.startsWith('en') && language === 'ta') {
        const isEnglishRequest = /english/i.test(text);
        if (isEnglishRequest) {
          setLanguage('en');
          saveLanguage('en');
        }
      }

      // Process emotion through the theme engine (real API response)
      const emotionSource = voiceEmotion && voiceEmotion !== 'neutral' ? 'voice' : 'text';
      const effectiveUserEmotion = voiceEmotion && voiceEmotion !== 'neutral'
        ? voiceEmotion
        : (turn.user_emotion || 'neutral');

      themeEngine.processInference({
        primary_emotion: effectiveUserEmotion,
        confidence: voiceEmotion && voiceEmotion !== 'neutral' ? 0.80 : 0.72,
        distribution: { [effectiveUserEmotion]: 0.75, neutral: 0.25 },
      }, emotionSource);

      if (turn.companion_emotion) {
        setCompanionEmotion(turn.companion_emotion);
      }

      // Speak reply if not in crisis
      if (!turn.safety_notice?.is_crisis) {
        speakText(
          turn.content,
          turn.message_id,
          isTurnTamil ? 'ta-IN' : 'en-US',
          turn.audio_url
        );
      } else {
        setCompanionState('idle');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setCompanionState('idle');
      // Report model unavailability to theme engine
      themeEngine.reportModelUnavailable();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  // Derive theme for Navbar display
  const currentTheme = themeState.userTheme === 'dark' || themeState.userTheme === 'calm'
    ? 'dark' as const
    : 'light' as const;

  const isTamil = language === 'ta' || language.startsWith('ta');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* a11y Skip Link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content (Alt+1 for Chat)
      </a>

      {/* Primary Navigation Bar */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        language={language}
        onLanguageChange={(l: string) => {
          const lang = (l === 'ta' ? 'ta' : 'en') as 'en' | 'ta';
          setLanguage(lang);
          saveLanguage(lang);
        }}
        persona={persona}
        onPersonaChange={setPersona}
        theme={currentTheme}
        onThemeToggle={() => {
          // Cycle through themes: dark → light → calm → playful → dark
          const cycle: Record<string, 'light' | 'dark' | 'calm' | 'playful'> = {
            dark: 'light',
            light: 'calm',
            calm: 'playful',
            playful: 'dark',
          };
          themeEngine.setUserTheme(cycle[themeState.userTheme] || 'dark');
        }}
        isHighContrast={isHighContrast}
        onContrastToggle={() => setIsHighContrast((c) => !c)}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted((m) => !m)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        userMood={themeState.activeMood}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDevPanel={() => setIsDevPanelOpen(true)}
      />

      {/* Email Verification Status Banner if present */}
      {verificationBanner && (
        <div
          style={{
            maxWidth: '680px',
            margin: '8px auto',
            padding: '10px 16px',
            borderRadius: '12px',
            background: verificationBanner.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${verificationBanner.type === 'success' ? '#4ade80' : '#f87171'}`,
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>{verificationBanner.text}</span>
          <button
            onClick={() => setVerificationBanner(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Emotional State / Ambient Mood Status Banner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px 8px' }}>
        <EmotionalAvatar
          emotion={themeState.activeMood !== 'neutral' ? themeState.activeMood : companionEmotion}
          state={companionState}
          personaName={persona === 'friendly_companion' ? 'AI Friend' : persona.replace('_', ' ')}
          size={115}
          autoMoodEnabled={autoMoodEnabled}
          manualOverrideEmotion={manualOverrideEmotion}
          onToggleAutoMood={() => setAutoMoodEnabled((prev) => !prev)}
          onSetOverrideEmotion={(emo) => setManualOverrideEmotion(emo)}
          showControls={true}
        />

        {/* Dynamic Mood & Theme Pill */}
        <div
          style={{
            marginTop: '10px',
            padding: '6px 18px',
            borderRadius: '999px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.5s ease',
            backdropFilter: 'blur(16px)',
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: 'var(--current-emotion-color)',
              boxShadow: '0 0 10px var(--current-emotion-color)',
              display: 'inline-block',
            }}
          />
          <span>
            {isTamil ? 'மனநிலை:' : 'Mood:'}{' '}
            <strong style={{ color: 'var(--current-emotion-color)' }}>
              {themeState.activeTokens.label}
            </strong>
            {themeState.lastEmotionSource && !themeState.manualMoodOverride && (
              <span style={{ fontSize: '0.72rem', opacity: 0.75, marginLeft: '6px', fontWeight: 500 }}>
                ({themeState.lastEmotionSource === 'voice' ? 'Vocal Analysis' : 'Text Sentiment'})
              </span>
            )}
          </span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {themeState.manualMoodOverride ? (
              <>
                <span>🎭 {isTamil ? 'கைமுறை (Manual)' : 'Manual Override'}</span>
                <button
                  onClick={() => themeEngine.setManualMoodOverride(null)}
                  style={{
                    background: 'var(--current-emotion-soft)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--current-emotion-color)',
                    borderRadius: '8px',
                    padding: '2px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginLeft: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title={isTamil ? 'தானியங்கி பயன்முறைக்கு மாறவும்' : 'Return to Automatic AI Inference'}
                  aria-label="Return to automatic mood mode"
                >
                  ↩️ {isTamil ? 'தானியங்கி' : 'Auto'}
                </button>
              </>
            ) : themeState.moodAdaptationEnabled ? (
              <span>✨ {isTamil ? 'தானியங்கி AI' : 'Automatic AI'}</span>
            ) : (
              <span>⬜ {isTamil ? 'இயல்பு' : 'Neutral Fallback'}</span>
            )}
          </span>
        </div>
      </div>

      {/* Mood-Adaptive Activity Suggestions */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px 8px' }}>
        <MoodActivities
          onSelectMode={(mode) => setCurrentMode(mode as AppMode)}
          onSendMessage={handleSendMessage}
          language={language}
        />
      </div>

      {/* Floating Audio Notice (Autoplay policy or network status) */}
      {ttsNotice && (
        <div
          role="status"
          style={{
            maxWidth: '620px',
            margin: '0 auto 12px',
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #F87171',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>⚠️ {ttsNotice}</span>
          <button
            onClick={() => setTtsNotice(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 'bold',
              padding: '0 4px',
            }}
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 16px 24px',
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
        }}
      >
        {currentMode === 'chat' && (
          <div className="glass-panel" style={{ width: '100%', overflow: 'hidden', borderRadius: '20px' }}>
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSpeakMessage={(content, mId, audioUrl) => {
                const hasTamil = /[\u0B80-\u0BFF]/.test(content);
                speakText(content, mId, hasTamil ? 'ta-IN' : (language === 'ta' ? 'ta-IN' : 'en-US'), audioUrl);
              }}
              onStopSpeaking={stopSpeaking}
              currentlySpeakingMsgId={currentlySpeakingMsgId}
              audioLoadingMsgId={audioLoadingMsgId}
              language={language}
            />
          </div>
        )}

        {currentMode === 'voice' && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <VoiceControls
              onTranscript={handleSendMessage}
              isListening={companionState === 'listening'}
              setIsListening={(val) => setCompanionState(val ? 'listening' : 'idle')}
              language={language}
              isSpeaking={companionState === 'speaking'}
              onInterruptSpeech={stopSpeaking}
            />
            <div className="glass-panel" style={{ width: '100%', maxHeight: '360px', overflow: 'hidden', borderRadius: '20px' }}>
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onSpeakMessage={(content, mId, audioUrl) => {
                  const hasTamil = /[\u0B80-\u0BFF]/.test(content);
                  speakText(content, mId, hasTamil ? 'ta-IN' : (language === 'ta' ? 'ta-IN' : 'en-US'), audioUrl);
                }}
                onStopSpeaking={stopSpeaking}
                currentlySpeakingMsgId={currentlySpeakingMsgId}
                audioLoadingMsgId={audioLoadingMsgId}
                language={language}
              />
            </div>
          </div>
        )}

        {currentMode === 'games' && (
          <GamesView
            language={language}
            onSpeak={speakText}
            userMood={themeState.activeMood}
          />
        )}

        {currentMode === 'study' && <StudyView />}

        {currentMode === 'memories' && <MemoryVaultView />}
      </main>

      {/* Settings Panel (Slide-out) */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
      />

      {/* Developer Testing & Diagnostics Panel */}
      <DevTestingPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
        activeLanguage={language}
        onApplyEmotionToAvatar={(emo) => {
          setManualOverrideEmotion(emo);
        }}
      />

      {/* Login & Signup Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
        language={language}
      />

      {/* Transparency & Ethical Disclaimer Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '14px 20px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
        role="contentinfo"
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          🛡️ <strong>{isTamil ? 'AI தோழன் வெளிப்படைத்தன்மை அறிவிப்பு' : 'AI Friend Transparency Notice'}:</strong>{' '}
          {isTamil
            ? 'AI Friend ஆதரவான உரையாடலுக்காக வடிவமைக்கப்பட்ட ஒரு மென்பொருள் தோழன் ஆகும். இது மனநல மருத்துவருக்கு மாற்று அல்ல.'
            : 'AI Friend is an emotional AI companion for supportive conversation and games. It does not replace clinical therapy.'}{' '}
          Helplines: <strong>988</strong> (US/Canada), <strong>112</strong> (EU), <strong>9152987821</strong> (India Tele-MANAS).
        </div>
      </footer>
    </div>
  );
}

export default App;
