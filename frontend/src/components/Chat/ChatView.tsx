import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../services/api';
import { translations } from '../../services/i18n';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onSpeakMessage: (text: string, msgId?: string, audioUrl?: string | null) => void;
  onStopSpeaking?: () => void;
  currentlySpeakingMsgId?: string | null;
  audioLoadingMsgId?: string | null;
  language: string;
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
        flexDirection: 'column',
        height: '100%',
        maxHeight: '640px',
        width: '100%',
        background: 'transparent',
      }}
    >
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
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))',
                    border: '1px solid #F87171',
                    borderRadius: '18px',
                    padding: '14px 18px',
                    marginBottom: '8px',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      color: '#EF4444',
                      marginBottom: '6px',
                    }}
                  >
                    <span>🚨</span>
                    <span>24/7 Immediate Support Available</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Helplines: <strong>{msg.safety_notice.crisis_helpline}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href="tel:988"
                      className="btn-primary"
                      style={{
                        background: '#EF4444',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        borderRadius: '12px',
                      }}
                    >
                      📞 Call 988
                    </a>
                    <a
                      href="https://findahelpline.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        borderRadius: '12px',
                      }}
                    >
                      🌐 Find Local Helpline
                    </a>
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
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--pastel-lavender), var(--pastel-sky))',
                      border: '1.5px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                      marginBottom: '2px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    🤖
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
            <span style={{ fontSize: '1.1rem' }}>🤖</span>
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
  );
};
