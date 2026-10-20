import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const StudyView: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('eli5');
  const [explanation, setExplanation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pomodoro Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      alert('🔔 Pomodoro Focus block complete! Take a slow breath and rest for 5 minutes.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleExplain = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    const data = await api.explainConcept(topic.trim(), level);
    setExplanation(data);
    setIsLoading(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        maxWidth: '720px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>📚 Feynman Study Companion</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Master difficult subjects through intuitive analogies, zero jargon, and active recall.
        </p>
      </div>

      {/* Pomodoro Focus Banner */}
      <div
        className="glass-panel-elevated"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '4px solid var(--color-primary-500)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            ⏱️ {formatTime(timerSeconds)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Deep Work Focus Block (25 min)
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
          >
            {isTimerRunning ? '⏸️ Pause' : '▶️ Start Focus'}
          </button>
          <button
            onClick={() => {
              setIsTimerRunning(false);
              setTimerSeconds(25 * 60);
            }}
            className="btn-ghost"
            style={{ fontSize: '0.825rem' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Concept Explainer Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
            placeholder="Enter any complex topic (e.g. Black Holes, Neural Networks, Inflation)..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="eli5">Explain Like I'm 10 🧸</option>
            <option value="high_school">High School Level 🎒</option>
            <option value="university">University Depth 🎓</option>
          </select>
          <button
            onClick={handleExplain}
            disabled={isLoading || !topic.trim()}
            className="btn-primary"
          >
            {isLoading ? 'Synthesizing...' : 'Explain 💡'}
          </button>
        </div>
      </div>

      {/* Explainer Result Cards */}
      {explanation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metaphor / Analogy Card */}
          <div
            className="glass-panel-elevated"
            style={{
              padding: '18px 22px',
              borderLeft: '4px solid var(--color-amber-400)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-amber-400)', marginBottom: '6px' }}>
              🎨 The Everyday Analogy:
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{explanation.analogy}</p>
          </div>

          {/* Core Idea */}
          <div
            className="glass-panel-elevated"
            style={{
              padding: '18px 22px',
              borderLeft: '4px solid var(--color-primary-400)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-primary-400)', marginBottom: '6px' }}>
              🔍 Foundational Insight:
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{explanation.core_idea}</p>
          </div>

          {/* Check-in Question */}
          <div
            className="glass-panel-elevated"
            style={{
              padding: '18px 22px',
              borderLeft: '4px solid #c084fc',
            }}
          >
            <div style={{ fontWeight: 600, color: '#c084fc', marginBottom: '6px' }}>
              ❓ Active Recall Challenge:
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic' }}>
              {explanation.check_question}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
