import React, { useState, useEffect } from 'react';
import type { ThemeEngineState, MoodCategory } from '../../services/themeEngine';
import { getThemeEngine } from '../../services/themeEngine';

interface MoodActivitiesProps {
  onSelectMode: (mode: string) => void;
  onSendMessage: (text: string) => void;
  language: string;
}

interface Activity {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  mood: MoodCategory | 'all';
}

/**
 * Mood-sensitive activity suggestions panel.
 * Adapts suggestions based on current mood state.
 *
 * Design principle: If user explicitly asks for an activity,
 * honour that request rather than forcing a mood-based experience (ARCHITECTURE.md §3.1).
 */
export const MoodActivities: React.FC<MoodActivitiesProps> = ({
  onSelectMode,
  onSendMessage,
  language,
}) => {
  const engine = getThemeEngine();
  const [state, setState] = useState<ThemeEngineState>(engine.getState());
  const [dismissed, setDismissed] = useState(false);
  const isTamil = language === 'ta' || language.startsWith('ta');

  useEffect(() => {
    const unsub = engine.subscribe((s) => {
      setState(s);
      setDismissed(false); // re-show when mood changes
    });
    return unsub;
  }, []);

  if (dismissed) return null;

  const category = state.activeTokens.category;

  // Activities filtered by current mood category
  const allActivities: Activity[] = [
    // Low mood activities — calm, supportive
    {
      id: 'breathing',
      label: isTamil ? 'மூச்சு பயிற்சி' : 'Breathing Exercise',
      icon: '🌬️',
      action: () => onSendMessage(isTamil ? 'மூச்சு பயிற்சி செய்வோமா?' : 'Guide me through a breathing exercise'),
      mood: 'low',
    },
    {
      id: 'gentle-chat',
      label: isTamil ? 'அமைதியான உரையாடல்' : 'Quiet Conversation',
      icon: '💬',
      action: () => onSelectMode('chat'),
      mood: 'low',
    },
    {
      id: 'easy-riddle',
      label: isTamil ? 'எளிய விடுகதை' : 'Gentle Riddle',
      icon: '🧩',
      action: () => onSendMessage(isTamil ? 'ஒரு எளிய விடுகதை சொல்லுங்கள்' : 'Tell me a gentle, easy riddle'),
      mood: 'low',
    },

    // Positive mood activities — engaging, lively
    {
      id: 'game',
      label: isTamil ? 'விளையாட்டு' : 'Play a Game',
      icon: '🎮',
      action: () => onSelectMode('games'),
      mood: 'positive',
    },
    {
      id: 'joke',
      label: isTamil ? 'நகைச்சுவை' : 'Tell Me a Joke',
      icon: '😄',
      action: () => onSendMessage(isTamil ? 'ஒரு வேடிக்கையான நகைச்சுவை சொல்' : 'Tell me a funny joke!'),
      mood: 'positive',
    },
    {
      id: 'trivia',
      label: isTamil ? 'பொது அறிவு' : 'Fun Trivia',
      icon: '🧠',
      action: () => onSelectMode('games'),
      mood: 'positive',
    },

    // Neutral activities — balanced
    {
      id: 'study',
      label: isTamil ? 'படிப்பு' : 'Study Session',
      icon: '📚',
      action: () => onSelectMode('study'),
      mood: 'neutral',
    },
    {
      id: 'chat-neutral',
      label: isTamil ? 'உரையாடல்' : 'Chat',
      icon: '💬',
      action: () => onSelectMode('chat'),
      mood: 'neutral',
    },
    {
      id: 'riddles-neutral',
      label: isTamil ? 'விடுகதைகள்' : 'Riddles',
      icon: '🧩',
      action: () => onSelectMode('games'),
      mood: 'neutral',
    },
  ];

  // Filter activities: show mood-specific + some universal
  const relevantActivities = allActivities.filter(
    (a) => a.mood === category || a.mood === 'all'
  );

  // If no mood-specific activities, show neutral ones
  const displayActivities = relevantActivities.length > 0
    ? relevantActivities.slice(0, 3)
    : allActivities.filter((a) => a.mood === 'neutral').slice(0, 3);

  // Only show when there are mood-specific suggestions
  if (category === 'uncertain' || (!state.moodAdaptationEnabled && !state.manualMoodOverride)) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        maxWidth: '680px',
        width: '100%',
        flexWrap: 'wrap',
      }}
      role="complementary"
      aria-label="Mood-based activity suggestions"
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {category === 'low'
          ? (isTamil ? '💙 மென்மையான செயல்கள்:' : '💙 Gentle suggestions:')
          : category === 'positive'
          ? (isTamil ? '✨ வேடிக்கையான செயல்கள்:' : '✨ Fun activities:')
          : (isTamil ? '💬 பரிந்துரைகள்:' : '💬 Suggestions:')}
      </span>

      {displayActivities.map((activity) => (
        <button
          key={activity.id}
          onClick={activity.action}
          className="btn-ghost"
          style={{
            padding: '4px 12px',
            fontSize: '0.78rem',
            borderRadius: '12px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{activity.icon}</span>
          <span>{activity.label}</span>
        </button>
      ))}

      <button
        onClick={() => setDismissed(true)}
        className="btn-ghost"
        style={{
          marginLeft: 'auto',
          padding: '2px 8px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}
        aria-label="Dismiss suggestions"
      >
        ✕
      </button>
    </div>
  );
};
