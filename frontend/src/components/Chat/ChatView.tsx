import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../services/api';
import { translations } from '../../services/i18n';
import { EmotionalAvatar, CompanionMiniAvatar, type CompanionState } from '../Avatar/EmotionalAvatar';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onSpeakMessage: (text: string, msgId?: string, audioUrl?: string | null) => void;
  onStopSpeaking?: () => void;
  currentlySpeakingMsgId?: string | null;
  audioLoadingMsgId?: string | null;
  language: string;
  companionEmotion?: string;
  companionState?: CompanionState;
  personaName?: string;
  onOpenSettings?: () => void;
  onOpenAiSettings?: () => void;
  onNavigateTab?: (mode: 'games' | 'study' | 'memories' | 'voice') => void;
  conversationMode?: 'normal' | 'dump';
  onToggleConversationMode?: (mode: 'normal' | 'dump') => void;
  moodLabel?: string;
  companionName?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSpeakMessage,
  onStopSpeaking,
  currentlySpeakingMsgId,
  audioLoadingMsgId,
  language,
  companionEmotion = 'neutral',
  companionState = 'idle',
  personaName = 'AI Friend',
  onOpenSettings,
  onOpenAiSettings,
  onNavigateTab,
  conversationMode = 'normal',
  onToggleConversationMode,
  moodLabel,
  companionName,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [playedMsgIds, setPlayedMsgIds] = useState<Set<string>>(new Set());

  const endRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const isTamil = language === 'ta';
  const t = isTamil ? translations.ta : translations.en;
  const recognitionLocale = isTamil ? 'ta-IN' : 'en-US';

  // Auto scroll to bottom on new message or loading state
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    if (isRecording) {
      stopRecording();
    }
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Toggle Speech Recognition directly into chat input
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicStatus(
        isTamil
          ? 'உங்கள் உலாவியில் பேச்சுணர்தல் வசதி இல்லை. தயவுசெய்து Chrome/Edge பயன்படுத்தவும்.'
          : 'Web Speech API is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = recognitionLocale;

      let baseText = inputText ? (inputText.endsWith(' ') ? inputText : inputText + ' ') : '';

      recognition.onstart = () => {
        setIsRecording(true);
        setMicStatus(
          isTamil
            ? '🎙️ தமிழில் பேசுங்கள்... (Listening in Tamil ta-IN)'
            : '🎙️ Listening in English (en-US)... Speak now'
        );
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalized = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalized += trans;
          } else {
            interim += trans;
          }
        }

        const newText = baseText + finalized + (interim ? (finalized ? ' ' : '') + interim : '');
        setInputText(newText);

        if (finalized) {
          baseText = newText.endsWith(' ') ? newText : newText + ' ';
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Chat mic speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicStatus(t.speechErrorMicDenied);
        } else if (event.error === 'network') {
          setMicStatus(t.speechErrorNetwork);
        } else if (event.error === 'no-speech') {
          setMicStatus(t.speechNoAudio);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setMicStatus(t.speechErrorMicDenied);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const handleAudioControl = (msg: ChatMessage) => {
    if (currentlySpeakingMsgId === msg.id) {
      onStopSpeaking?.();
    } else {
      setPlayedMsgIds((prev) => new Set(prev).add(msg.id));
      onSpeakMessage(msg.content, msg.id, msg.audio_url);
    }
  };

  const suggestions = t.suggestions || [];

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        width: '100%',
        height: '100%',
        background: 'transparent',
        alignItems: 'stretch',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* ─── Main Chat Column ─── */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flex: 1,
          minWidth: 0,
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
      {/* ─── Integrated Companion Chat Header (Requirement Part 3) ─── */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px 24px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{ cursor: (onOpenAiSettings || onOpenSettings) ? 'pointer' : 'default' }}
            onClick={onOpenAiSettings || onOpenSettings}
            title={isTamil ? 'அவதார் & குரலை மாற்ற கிளிக் செய்யவும்' : 'Click to customize companion avatar & voice'}
          >
            <CompanionMiniAvatar size={42} emotion={companionEmotion} state={companionState} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {companionName || personaName || 'AI Friend'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--current-emotion-soft)',
                  color: 'var(--current-emotion-color)',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--current-emotion-color)' }} />
                <span>{moodLabel || 'Attentive & Ready'}</span>
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isTamil ? 'உணர்ச்சி சார்ந்த மெய்நிகர் தோழன்' : 'Empathetic Emotional AI Companion'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface-card)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: companionState === 'speaking' ? '#9D8DF1' : companionState === 'listening' ? '#63D8A5' : 'var(--current-emotion-color)',
                display: 'inline-block',
              }}
            />
            <span>
              {companionState === 'speaking'
                ? (isTamil ? 'பேசுகிறது...' : 'Speaking...')
                : companionState === 'listening'
                ? (isTamil ? 'கேட்கிறது...' : 'Listening...')
                : isLoading
                ? (isTamil ? 'சிந்திக்கிறது...' : 'Thinking...')
                : (isTamil ? 'இணைப்பில் உள்ளது' : 'Online & Attentive')}
            </span>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              margin: 'auto',
              maxWidth: '460px',
              padding: '24px 16px',
            }}
          >
            <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>✨</div>
            <h3
              style={{
                fontSize: '1.3rem',
                marginBottom: '8px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {t.chatWelcomeTitle}
            </h3>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                marginBottom: '22px',
                lineHeight: 1.6,
              }}
            >
              {t.chatWelcomeSubtitle}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(s)}
                  className="btn-ghost"
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontSize: '0.835rem',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 200ms ease',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCrisis = msg.safety_notice?.is_crisis;
          const isSpeakingThis = currentlySpeakingMsgId === msg.id;
          const isLoadingAudioThis = audioLoadingMsgId === msg.id;
          const hasBeenPlayed = playedMsgIds.has(msg.id);

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: '6px',
              }}
            >
              {/* Crisis Emergency Card */}
              {isCrisis && msg.safety_notice && (
                <div
                  style={{
                    maxWidth: '540px',
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(254, 226, 226, 0.45))',
                    border: '1.5px solid #F87171',
                    borderRadius: '18px',
                    padding: '16px 20px',
                    marginBottom: '8px',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 800,
                      color: '#DC2626',
                      marginBottom: '8px',
                      fontSize: '1rem',
                    }}
                  >
                    <span>🚨</span>
                    <span>Emergency Parent Alert Dispatched</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.55 }}>
                    An immediate emergency SMS notification has been dispatched to your registered parent/guardian contact
                    {msg.safety_notice.parent_contact_notified ? (
                      <> (<strong>{msg.safety_notice.parent_contact_notified}</strong>)</>
                    ) : (
                      <> (provided during signup)</>
                    )}.
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: '#991B1B',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🛡️</span>
                    <span>Your life is deeply valued. Please take slow, deep breaths and stay right here with me.</span>
                  </div>
                </div>
              )}

              {/* Message Bubble + Robot Emblem for Assistant */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  maxWidth: '82%',
                  alignItems: 'flex-end',
                }}
              >
                {!isUser && (
                  <div style={{ flexShrink: 0, marginBottom: '2px' }}>
                    <CompanionMiniAvatar
                      size={34}
                      emotion={msg.companion_emotion || companionEmotion}
                      state={currentlySpeakingMsgId === msg.id ? 'speaking' : 'idle'}
                    />
                  </div>
                )}

                <div
                  style={{
                    padding: '13px 18px',
                    borderRadius: isUser ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                    background: isUser
                      ? 'linear-gradient(135deg, var(--current-emotion-color), #7461DE)'
                      : 'var(--bg-surface-elevated)',
                    color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                    fontSize: '0.925rem',
                    lineHeight: '1.65',
                    border: isUser ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: isUser
                      ? '0 6px 20px -2px var(--current-emotion-glow)'
                      : 'var(--shadow-sm)',
                    wordBreak: 'break-word',
                    position: 'relative',
                  }}
                >
                  {msg.content}

                  {/* Assistant Audio and Tone Controls Footer */}
                  {!isUser && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        gap: '8px',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>✨</span>
                        <span>{msg.companion_emotion ? `Tone: ${msg.companion_emotion}` : 'Companion'}</span>
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleAudioControl(msg)}
                          disabled={isLoadingAudioThis}
                          className="btn-ghost"
                          style={{
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isSpeakingThis
                              ? 'rgba(239, 68, 68, 0.15)'
                              : isLoadingAudioThis
                              ? 'var(--bg-surface)'
                              : 'var(--current-emotion-soft)',
                            color: isSpeakingThis
                              ? '#EF4444'
                              : 'var(--text-primary)',
                            border: `1px solid ${
                              isSpeakingThis ? '#EF4444' : 'var(--border-subtle)'
                            }`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: isLoadingAudioThis ? 'wait' : 'pointer',
                          }}
                          title={
                            isLoadingAudioThis
                              ? (isTamil ? 'குரல் பதிவிறக்கப்படுகிறது...' : 'Loading audio stream...')
                              : isSpeakingThis
                              ? t.stopAudio
                              : hasBeenPlayed
                              ? t.replayAudio
                              : t.readAloud
                          }
                        >
                          {isLoadingAudioThis ? (
                            <>
                              <span style={{ fontSize: '0.8rem' }}>⏳</span>
                              <span>{isTamil ? 'ஏற்றுகிறது...' : 'Loading...'}</span>
                            </>
                          ) : isSpeakingThis ? (
                            <>
                              <span>⏹️</span>
                              <span>{t.stopAudio}</span>
                            </>
                          ) : hasBeenPlayed ? (
                            <>
                              <span>🔁</span>
                              <span>{t.replayAudio}</span>
                            </>
                          ) : (
                            <>
                              <span>🔊</span>
                              <span>{t.readAloud}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Real Loading / Thinking Indicator tied to actual AI request */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              padding: '6px 12px',
              background: 'var(--current-emotion-soft)',
              borderRadius: '16px',
              width: 'fit-content',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <CompanionMiniAvatar size={22} />
            <span>{t.thinkingState}</span>
            <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--current-emotion-color)', animation: 'robotHover 1.2s infinite' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--current-emotion-color)', animation: 'robotHover 1.2s 0.2s infinite' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--current-emotion-color)', animation: 'robotHover 1.2s 0.4s infinite' }} />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Recording Status Bar */}
      {micStatus && (
        <div
          style={{
            padding: '7px 18px',
            fontSize: '0.78rem',
            background: isRecording ? 'rgba(99, 216, 165, 0.15)' : 'rgba(239, 68, 68, 0.12)',
            color: isRecording ? '#38B57E' : '#EF4444',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontWeight: 600 }}>{micStatus}</span>
          {isRecording ? (
            <button
              onClick={stopRecording}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Done speaking
            </button>
          ) : (
            <button
              onClick={() => setMicStatus(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Message Input Bar */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        {/* Soft Pastel Microphone Button */}
        <button
          type="button"
          onClick={toggleRecording}
          style={{
            padding: '11px 13px',
            borderRadius: '16px',
            background: isRecording
              ? 'linear-gradient(135deg, #EF4444, #DC2626)'
              : 'var(--bg-surface-elevated)',
            color: isRecording ? '#FFFFFF' : 'var(--text-primary)',
            border: isRecording ? '1px solid #F87171' : '1px solid var(--border-subtle)',
            boxShadow: isRecording
              ? '0 0 16px rgba(239, 68, 68, 0.5)'
              : 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isRecording ? 'Stop recording' : isTamil ? 'தமிழில் பேச மைக் தொடவும்' : 'Tap to speak'}
          disabled={isLoading}
          aria-label={isRecording ? 'Stop recording' : 'Start microphone recording'}
        >
          <span style={{ fontSize: '1.15rem' }}>{isRecording ? '⏹️' : '🎙️'}</span>
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.inputPlaceholder}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            outline: 'none',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            boxShadow: 'var(--shadow-sm)',
          }}
          disabled={isLoading}
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          className="btn-primary"
          style={{ padding: '12px 20px', borderRadius: '16px' }}
          aria-label={t.sendButton}
        >
          <span>{t.sendButton}</span>
          <span>✈️</span>
        </button>
      </div>
      </div>

      {/* ─── Right Companion & Voice Call Panel (Inspired by reference mockup) ─── */}
      <div
        className="chat-companion-panel"
        style={{
          width: '290px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          height: '100%',
          overflowY: 'auto',
          paddingRight: '2px',
        }}
      >
        {/* Voice Call Card */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            borderRadius: '22px',
            border: '1px solid var(--border-subtle)',
            padding: '12px 14px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 8px 28px var(--shadow-sm)',
            position: 'relative',
          }}
        >
          {/* Encouragement bubble */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '3px 7px',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--current-emotion-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {moodLabel ? `${moodLabel} 🌸` : "You're doing great! 🌸"}
          </div>

          {/* Prominent Companion Avatar (Dynamically adapts to 3D Human Avatar or Animated Emoji based on AI Settings) */}
          <div style={{ margin: '6px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <EmotionalAvatar
              size={135}
              emotion={companionEmotion}
              state={companionState}
              showControls={false}
            />
            {onOpenAiSettings && (
              <button
                type="button"
                onClick={onOpenAiSettings}
                id="chat-customize-ai-btn"
                style={{
                  padding: '3px 12px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--current-emotion-color, #6366f1)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 150ms ease',
                }}
                title="Configure AI Companion, 3D Avatar & Voice"
              >
                <span>✨</span>
                <span>{isTamil ? 'தோழன் அமைப்புகள்' : 'AI Settings'}</span>
              </button>
            )}
          </div>

          {/* Voice Call Widget Box */}
          <div
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
              borderRadius: '16px',
              padding: '12px 14px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                <span>💠</span>
                <span>Voice Call</span>
              </div>
              <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                {companionState === 'speaking' ? 'Speaking' : companionState === 'listening' ? 'Listening' : 'Ready'}
              </span>
            </div>

            {/* Audio Waveform Animation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '22px' }}>
              {[10, 16, 22, 14, 18, 22, 13, 20, 15, 10].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: companionState === 'speaking' ? `${h}px` : isRecording ? `${h * 0.8}px` : '5px',
                    background: '#ffffff',
                    borderRadius: '2px',
                    transition: 'height 150ms ease',
                  }}
                />
              ))}
            </div>

            {/* Call Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={toggleRecording}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isRecording ? '#ef4444' : 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                🎙️
              </button>

              <button
                onClick={() => onNavigateTab?.('voice')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Open Voice Call View"
              >
                📞
              </button>

              <button
                onClick={() => onSpeakMessage(isTamil ? 'வணக்கம், நான் உங்கள் தோழன்!' : 'Hello, I am listening!')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Test Audio Speaker"
              >
                🔊
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              onClick={() => onNavigateTab?.('games')}
              style={{
                padding: '8px 4px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-card)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--current-emotion-color)',
                transition: 'all 150ms ease',
              }}
            >
              <span style={{ fontSize: '1.15rem' }}>🎮</span>
              <span>Games</span>
            </button>

            <button
              onClick={() => onNavigateTab?.('study')}
              style={{
                padding: '8px 4px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-card)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--current-emotion-color)',
                transition: 'all 150ms ease',
              }}
            >
              <span style={{ fontSize: '1.15rem' }}>📖</span>
              <span>Study</span>
            </button>

            <button
              onClick={() => onNavigateTab?.('memories')}
              style={{
                padding: '8px 4px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-card)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--current-emotion-color)',
                transition: 'all 150ms ease',
              }}
            >
              <span style={{ fontSize: '1.15rem' }}>🗄️</span>
              <span>Memory</span>
            </button>
          </div>
        </div>

        {/* Conversation Mode (Normal Chat vs Dump Mode) */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Conversation Mode
          </div>
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface-card)',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => onToggleConversationMode?.('normal')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '9px',
                border: 'none',
                background: conversationMode === 'normal' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: conversationMode === 'normal' ? 'var(--current-emotion-color)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.76rem',
                cursor: 'pointer',
                boxShadow: conversationMode === 'normal' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              Normal Chat
            </button>
            <button
              onClick={() => onToggleConversationMode?.('dump')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '9px',
                border: 'none',
                background: conversationMode === 'dump' ? 'var(--current-pastel-gradient)' : 'transparent',
                color: conversationMode === 'dump' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.76rem',
                cursor: 'pointer',
                boxShadow: conversationMode === 'dump' ? '0 2px 8px var(--current-emotion-glow)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              Dump Mode 🤫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

