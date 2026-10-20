import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../services/api';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onSpeakMessage: (text: string) => void;
  language: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSpeakMessage,
  language,
}) => {
  const [inputText, setInputText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick suggestion prompts
  const suggestionsByLang: Record<string, string[]> = {
    en: [
      'Tell me an interesting riddle 🧩',
      'I had a demanding day and need to vent ☕',
      'Explain quantum computers like I am 10 🚀',
      'Let\'s invent a mystery story together 📖',
    ],
    es: [
      'Cuéntame una adivinanza divertida 🧩',
      'Tuve un día pesado y necesito desahogarme ☕',
      'Explícame la relatividad de Einstein de forma simple 🚀',
    ],
    hi: [
      'मुझे कोई मजेदार पहेली सुनाओ 🧩',
      'आज मेरा दिन बहुत थका देने वाला था ☕',
      'ब्लैक होल कैसे काम करता है? 🚀',
    ],
  };

  const currentSuggestions = suggestionsByLang[language] || suggestionsByLang.en;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '620px',
        width: '100%',
      }}
    >
      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              margin: 'auto',
              maxWidth: '440px',
              padding: '24px',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👋</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              Welcome to your quiet space
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              I'm an AI companion here to listen with empathy, share lighthearted moments, tutor study topics, or simply keep you company.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(s)}
                  className="btn-ghost"
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.825rem',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
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

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: '4px',
              }}
            >
              {/* Crisis Emergency Card */}
              {isCrisis && msg.safety_notice && (
                <div
                  style={{
                    maxWidth: '540px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #7f1d1d, #450a0a)',
                    border: '1px solid #f87171',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    marginBottom: '8px',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#fecaca', marginBottom: '6px' }}>
                    <span>🚨</span>
                    <span>24/7 Immediate Support Available</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginBottom: '8px' }}>
                    Helplines:{' '}
                    <strong style={{ color: '#ffffff' }}>{msg.safety_notice.crisis_helpline}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href="tel:988"
                      className="btn-primary"
                      style={{
                        background: '#dc2626',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
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
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        color: '#f8fafc',
                        textDecoration: 'none',
                      }}
                    >
                      🌐 Find Local Helpline
                    </a>
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 18px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isUser
                    ? 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))'
                    : 'var(--bg-surface-elevated)',
                  color: '#ffffff',
                  fontSize: '0.925rem',
                  lineHeight: '1.6',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  wordBreak: 'break-word',
                  position: 'relative',
                }}
              >
                {msg.content}

                {/* Assistant controls & metadata footer */}
                {!isUser && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>
                      {msg.companion_emotion ? `Tone: ${msg.companion_emotion}` : 'Companion'}
                    </span>
                    <button
                      onClick={() => onSpeakMessage(msg.content)}
                      className="btn-ghost"
                      style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                      title="Read aloud"
                    >
                      🔊 Listen
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span style={{ animation: 'breathingOrb 1.5s infinite' }}>✨</span>
            <span>AI Friend is reflecting...</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Message Input Bar */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your mind, ask for a riddle, or request study help..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 200ms ease',
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          className="btn-primary"
          style={{ padding: '12px 18px', borderRadius: '12px' }}
        >
          <span>Send</span>
          <span>✈️</span>
        </button>
      </div>
    </div>
  );
};
