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
import { api } from './services/api';
import type { ChatMessage } from './services/api';

export function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('chat');
  const [companionEmotion, setCompanionEmotion] = useState('neutral');
  const [companionState, setCompanionState] = useState<CompanionState>('idle');
  const [language, setLanguage] = useState('en');
  const [persona, setPersona] = useState('friendly_companion');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const isSpeakingRef = useRef(false);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // High contrast mode attribute
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  }, [isHighContrast]);

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
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update dynamic ambient emotion variables
  useEffect(() => {
    const emotionGlows: Record<string, { color: string; glow: string }> = {
      neutral: { color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.25)' },
      happy: { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.35)' },
      sad: { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)' },
      angry: { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.35)' },
      anxious: { color: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
      surprised: { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.35)' },
    };
    const t = emotionGlows[companionEmotion] || emotionGlows.neutral;
    document.documentElement.style.setProperty('--current-emotion-color', t.color);
    document.documentElement.style.setProperty('--current-emotion-glow', t.glow);
  }, [companionEmotion]);

  // Create initial chat session
  useEffect(() => {
    const initSession = async () => {
      const sess = await api.createSession('AI Friend Session', language, persona);
      setSessionId(sess.id);
    };
    initSession();
  }, [language, persona]);

  // Speech Synthesis
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.95; // Gentle, unhurried cadence
    utterance.pitch = 1.05;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(language));
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setCompanionState('speaking');
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setCompanionState('idle');
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setCompanionState('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Barge-In Interrupt Handler
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setCompanionState('idle');
  };

  // Handle User Message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Barge-in: stop any active assistant speech
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
      const turn = await api.sendMessage(sessionId, text, language, 'neutral');

      const companionReply: ChatMessage = {
        id: turn.message_id,
        role: 'assistant',
        content: turn.content,
        companion_emotion: turn.companion_emotion,
        safety_notice: turn.safety_notice,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, companionReply]);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* a11y Skip Link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content (or press Alt+1 for Chat)
      </a>

      {/* Primary Navigation Bar */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        language={language}
        onLanguageChange={setLanguage}
        persona={persona}
        onPersonaChange={setPersona}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isHighContrast={isHighContrast}
        onContrastToggle={() => setIsHighContrast(!isHighContrast)}
        isMuted={isMuted}
        onMuteToggle={() => {
          if (!isMuted) stopSpeaking();
          setIsMuted(!isMuted);
        }}
      />

      {/* Hero Emotional Avatar Banner */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 16px 20px',
        }}
        role="region"
        aria-label="Companion Avatar Status"
      >
        <EmotionalAvatar
          emotion={companionEmotion}
          state={companionState}
          size={currentMode === 'voice' ? 180 : 120}
        />
      </div>

      {/* Main Content View Container */}
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
          <div className="glass-panel" style={{ width: '100%', overflow: 'hidden' }}>
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSpeakMessage={speakText}
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
            <div className="glass-panel" style={{ width: '100%', maxHeight: '360px', overflow: 'hidden' }}>
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onSpeakMessage={speakText}
                language={language}
              />
            </div>
          </div>
        )}

        {currentMode === 'games' && <GamesView />}

        {currentMode === 'study' && <StudyView />}

        {currentMode === 'memories' && <MemoryVaultView />}
      </main>

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
          🛡️ <strong>AI Friend Transparency Notice:</strong> AI Friend is an artificial intelligence companion designed for supportive conversation and learning. It does not replace clinical therapy or medical diagnosis. If you or someone you know is in crisis, please call or text <strong>988</strong> (US/Canada), <strong>112</strong> (EU), or <strong>9152987821</strong> (India Tele-MANAS). Hotkeys: Alt+1 (Chat), Alt+2 (Voice), Alt+3 (Games), Alt+4 (Study), Alt+5 (Vault), Alt+C (High Contrast), Alt+M (Mute).
        </div>
      </footer>
    </div>
  );
}

export default App;
