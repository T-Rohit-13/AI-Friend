import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navigation/Navbar';
import type { AppMode } from './components/Navigation/Navbar';
import { EmotionalAvatar } from './components/Avatar/EmotionalAvatar';
import type { CompanionState } from './components/Avatar/EmotionalAvatar';
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
  const [verificationBanner, setVerificationBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Settings Panel State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  const speakText = (text: string, msgId?: string) => {
    if (isMuted) return;
    stopSpeaking();
    setCurrentlySpeakingMsgId(msgId || null);

    // If Tamil, check if browser has native Tamil voice; if not, use high-fidelity neural edge-tts
    if (language === 'ta') {
      const voices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [];
      const tamilVoice = voices.find(
        (v) =>
          v.lang === 'ta-IN' ||
          v.lang.startsWith('ta') ||
          v.name.toLowerCase().includes('tamil') ||
          v.name.toLowerCase().includes('valluvar')
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
        };
        utterance.onend = () => {
          isSpeakingRef.current = false;
          setCurrentlySpeakingMsgId(null);
          setCompanionState('idle');
        };
        utterance.onerror = () => {
          isSpeakingRef.current = false;
          setCurrentlySpeakingMsgId(null);
          setCompanionState('idle');
        };
        window.speechSynthesis.speak(utterance);
        return;
      }

      // If browser lacks a native Tamil voice, stream neural Tamil audio from backend edge-tts
      try {
        const audioUrl = api.getTtsAudioUrl(text, 'ta');
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;

        audio.onplay = () => {
          isSpeakingRef.current = true;
          setCompanionState('speaking');
        };
        audio.onended = () => {
          isSpeakingRef.current = false;
          setCurrentlySpeakingMsgId(null);
          setCompanionState('idle');
        };
        audio.onerror = (e) => {
          console.warn('Backend Tamil TTS playback notice:', e);
          isSpeakingRef.current = false;
          setCurrentlySpeakingMsgId(null);
          setCompanionState('idle');
        };
        audio.play().catch((err) => {
          console.warn('Audio play auto-policy warning:', err);
          setCompanionState('idle');
          setCurrentlySpeakingMsgId(null);
        });
        return;
      } catch (err) {
        console.warn('Tamil TTS synthesis error:', err);
      }
    }

    // Default Web Speech for English
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice =
        voices.find((v) => v.lang.startsWith('en')) ||
        voices.find((v) => v.lang.includes('en') || v.name.includes('Jenny') || v.name.includes('David'));

      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setCompanionState('speaking');
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setCurrentlySpeakingMsgId(null);
        setCompanionState('idle');
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setCurrentlySpeakingMsgId(null);
        setCompanionState('idle');
      };

      window.speechSynthesis.speak(utterance);
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
        companion_emotion: turn.companion_emotion,
        detected_emotion: turn.user_emotion,
        safety_notice: turn.safety_notice,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, companionReply]);

      // Process emotion through the theme engine (real API response)
      // The theme engine handles confidence filtering, smoothing, and hysteresis
      if (turn.user_emotion && turn.user_emotion !== 'neutral') {
        // Create a properly structured inference result from the chat response
        themeEngine.processInference({
          primary_emotion: turn.user_emotion,
          // The chat endpoint returns emotion as a label; we estimate confidence
          // from the vocal signal if available, otherwise use moderate confidence
          confidence: voiceEmotion && voiceEmotion !== 'neutral' ? 0.72 : 0.6,
          distribution: { [turn.user_emotion]: 0.7, neutral: 0.3 },
        });
      }

      if (turn.companion_emotion) {
        setCompanionEmotion(turn.companion_emotion);
      }

      // Speak reply if not in crisis
      if (!turn.safety_notice?.is_crisis) {
        speakText(turn.content);
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

  const isTamil = language === 'ta';

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
          size={110}
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
          maxWidth: '880px',
          margin: '0 auto',
        }}
      >
        {currentMode === 'chat' && (
          <div className="glass-panel" style={{ width: '100%', overflow: 'hidden', borderRadius: '20px' }}>
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSpeakMessage={speakText}
              onStopSpeaking={stopSpeaking}
              currentlySpeakingMsgId={currentlySpeakingMsgId}
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
                onSpeakMessage={speakText}
                onStopSpeaking={stopSpeaking}
                currentlySpeakingMsgId={currentlySpeakingMsgId}
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
