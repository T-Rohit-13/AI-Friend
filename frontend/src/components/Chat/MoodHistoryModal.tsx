import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { ChatMessage } from '../../services/api';

export interface MoodSessionSummary {
  id: string;
  title: string;
  persona: string;
  language: string;
  mode: string;
  dominant_mood: string;
  message_count: number;
  last_message_preview?: string;
  updated_at: string;
  created_at: string;
}

interface MoodHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string, messages: ChatMessage[], title: string) => void;
  language?: string;
}

const MOOD_META: Record<
  string,
  { label: string; icon: string; bg: string; border: string; color: string; desc: string }
> = {
  happy: {
    label: 'Happy & Energetic',
    icon: '☀️',
    bg: 'linear-gradient(135deg, rgba(254, 240, 138, 0.35), rgba(253, 186, 116, 0.3))',
    border: 'rgba(251, 191, 36, 0.5)',
    color: '#b45309',
    desc: 'Moments of warmth, joy, and lively energy',
  },
  calm: {
    label: 'Calm & Focused',
    icon: '🌿',
    bg: 'linear-gradient(135deg, rgba(187, 247, 208, 0.35), rgba(186, 230, 253, 0.3))',
    border: 'rgba(52, 211, 153, 0.5)',
    color: '#047857',
    desc: 'Moments of serenity, peace, and deep reflection',
  },
  sad: {
    label: 'Sad & Low',
    icon: '💜',
    bg: 'linear-gradient(135deg, rgba(221, 214, 254, 0.4), rgba(199, 210, 254, 0.3))',
    border: 'rgba(167, 139, 250, 0.5)',
    color: '#6d28d9',
    desc: 'Vulnerable moments where gentle support was shared',
  },
  stressed: {
    label: 'Stressed & Frustrated',
    icon: '⚡',
    bg: 'linear-gradient(135deg, rgba(254, 205, 211, 0.4), rgba(245, 208, 254, 0.3))',
    border: 'rgba(244, 114, 182, 0.5)',
    color: '#be185d',
    desc: 'De-stressing chats, vent sessions, and calming exercises',
  },
  excited: {
    label: 'Excited',
    icon: '🌟',
    bg: 'linear-gradient(135deg, rgba(253, 164, 175, 0.35), rgba(233, 213, 255, 0.35))',
    border: 'rgba(236, 72, 153, 0.5)',
    color: '#9d174d',
    desc: 'Celebrations, achievements, and playful gaming',
  },
  neutral: {
    label: 'Neutral / Mixed',
    icon: '⚪',
    bg: 'linear-gradient(135deg, rgba(243, 244, 246, 0.6), rgba(238, 242, 255, 0.5))',
    border: 'rgba(209, 213, 219, 0.7)',
    color: '#4b5563',
    desc: 'Balanced day-to-day conversation and check-ins',
  },
};

export const MoodHistoryModal: React.FC<MoodHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  language = 'en',
}) => {
  const [groupedHistory, setGroupedHistory] = useState<Record<string, MoodSessionSummary[]>>({
    happy: [],
    calm: [],
    sad: [],
    stressed: [],
    excited: [],
    neutral: [],
  });
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [openingSessionId, setOpeningSessionId] = useState<string | null>(null);

  const isTamil = language === 'ta';

  useEffect(() => {
    if (!isOpen) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.getChatHistoryByMood();
        setGroupedHistory(data);
      } catch (e) {
        console.warn('Failed to load mood history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenChat = async (session: MoodSessionSummary) => {
    setOpeningSessionId(session.id);
    try {
      const msgs = await api.getSessionMessages(session.id);
      onSelectSession(session.id, msgs, session.title);
      onClose();
    } catch (e) {
      console.error('Error opening session messages:', e);
    } finally {
      setOpeningSessionId(null);
    }
  };

  const totalSessions = Object.values(groupedHistory).reduce((acc, curr) => acc + curr.length, 0);

  const moodsToRender =
    selectedMoodFilter === 'all'
      ? ['happy', 'calm', 'sad', 'stressed', 'excited', 'neutral']
      : [selectedMoodFilter];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(30, 27, 75, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '85vh',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(216, 208, 252, 0.8)',
          boxShadow: '0 24px 64px rgba(79, 70, 229, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(216, 208, 252, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(205, 234, 252, 0.3), rgba(216, 208, 252, 0.4))',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🕒 🌈</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #2D2847)' }}>
                {isTamil ? 'மனநிலை வாரியான அரட்டை வரலாறு' : 'Chat History Grouped by Mood'}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
              {isTamil
                ? `மொத்தம் ${totalSessions} உரையாடல்கள் உங்கள் உணர்வு நிலைகளின் அடிப்படையில் பிரிக்கப்பட்டுள்ளன.`
                : `Review and reopen your ${totalSessions} conversations organized by your recorded emotional states.`}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.3rem',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(244, 240, 253, 0.6)',
            borderBottom: '1px solid rgba(216, 208, 252, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setSelectedMoodFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              background: selectedMoodFilter === 'all' ? '#4f46e5' : '#ffffff',
              color: selectedMoodFilter === 'all' ? '#ffffff' : '#4b5563',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}
          >
            All Moods ({totalSessions})
          </button>

          {Object.entries(MOOD_META).map(([key, meta]) => {
            const count = (groupedHistory[key] || []).length;
            const active = selectedMoodFilter === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedMoodFilter(key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${active ? meta.color : meta.border}`,
                  background: active ? meta.color : '#ffffff',
                  color: active ? '#ffffff' : meta.color,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 150ms ease',
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span style={{ opacity: 0.8, fontSize: '0.72rem' }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <div style={{ fontSize: '1.8rem', animation: 'spin 1s linear infinite' }}>⏳</div>
              <p style={{ marginTop: '10px', fontSize: '0.88rem' }}>Loading mood history...</p>
            </div>
          ) : totalSessions === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🌱</div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#374151' }}>
                {isTamil ? 'இன்னும் அரட்டைகள் சேமிக்கப்படவில்லை' : 'No Mood Conversations Yet'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem' }}>
                {isTamil
                  ? 'உங்கள் AI தோழனிடம் உரையாடத் தொடங்குங்கள். உங்கள் மனநிலைக்கு ஏற்ப அரட்டைகள் இங்கே தானாக ஒழுங்கமைக்கப்படும்!'
                  : 'Start chatting with AI-Friend! Your conversations will be automatically grouped by emotional context.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {moodsToRender.map((moodKey) => {
                const sessions = groupedHistory[moodKey] || [];
                const meta = MOOD_META[moodKey];
                if (!meta) return null;
                if (selectedMoodFilter === 'all' && sessions.length === 0) return null;

                return (
                  <div key={moodKey} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Section Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: meta.color }}>
                          {meta.label}
                        </span>
                        <span
                          style={{
                            background: '#ffffff',
                            color: meta.color,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                          }}
                        >
                          {sessions.length} {sessions.length === 1 ? 'chat' : 'chats'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                        {meta.desc}
                      </span>
                    </div>

                    {/* Session Cards Grid */}
                    {sessions.length === 0 ? (
                      <div style={{ padding: '16px', fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        No conversations in this mood group yet.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                          gap: '12px',
                        }}
                      >
                        {sessions.map((sess) => {
                          const dateStr = sess.updated_at
                            ? new Date(sess.updated_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recent';

                          const isOpening = openingSessionId === sess.id;

                          return (
                            <div
                              key={sess.id}
                              style={{
                                background: '#ffffff',
                                border: '1px solid rgba(216, 208, 252, 0.7)',
                                borderRadius: '16px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '10px',
                                transition: 'transform 150ms ease, box-shadow 150ms ease',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '6px',
                                    marginBottom: '6px',
                                  }}
                                >
                                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
                                    {dateStr}
                                  </span>
                                  {sess.mode === 'dump' && (
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        padding: '1px 6px',
                                        borderRadius: '6px',
                                        fontWeight: 700,
                                      }}
                                    >
                                      Dump Mode
                                    </span>
                                  )}
                                </div>

                                <h4
                                  style={{
                                    margin: '0 0 6px 0',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary, #2D2847)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={sess.title}
                                >
                                  {sess.title || 'Untitled Chat'}
                                </h4>

                                {sess.last_message_preview && (
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: '0.76rem',
                                      color: '#6b7280',
                                      lineHeight: 1.35,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    "{sess.last_message_preview}"
                                  </p>
                                )}
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderTop: '1px solid rgba(243, 244, 246, 0.9)',
                                  paddingTop: '8px',
                                }}
                              >
                                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                  💬 {sess.message_count} {sess.message_count === 1 ? 'msg' : 'msgs'}
                                </span>

                                <button
                                  onClick={() => handleOpenChat(sess)}
                                  disabled={isOpening}
                                  style={{
                                    background: meta.color,
                                    border: 'none',
                                    color: '#ffffff',
                                    padding: '5px 12px',
                                    borderRadius: '10px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: isOpening ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {isOpening ? 'Loading...' : 'Open Chat ▶'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
