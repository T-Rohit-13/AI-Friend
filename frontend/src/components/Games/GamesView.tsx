import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Riddle, TriviaQuestion } from '../../services/api';

export const GamesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'riddles' | 'trivia' | 'story'>('riddles');

  // Riddle state
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [riddleFeedback, setRiddleFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isCheckingRiddle, setIsCheckingRiddle] = useState(false);

  // Trivia state
  const [trivia, setTrivia] = useState<TriviaQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [triviaSubmitted, setTriviaSubmitted] = useState(false);

  // Story state
  const [storyBeat, setStoryBeat] = useState({
    narrative:
      "You find yourself standing in an ancient twilight observatory overgrown with luminous wisteria. " +
      "Before you stands a clockwork astrolabe with two glowing dials: one pulsating with deep cyan light, the other humming with warm golden warmth.",
    options: [
      "Turn the cyan dial aligned with the constellations of the deep sea",
      "Engage the golden dial resonating with ancient clockwork solar gears",
    ],
  });
  const [isAdvancingStory, setIsAdvancingStory] = useState(false);

  // Load initial riddle
  useEffect(() => {
    loadRiddle();
    loadTrivia();
  }, []);

  const loadRiddle = async () => {
    setRiddleFeedback(null);
    setRiddleAnswer('');
    setShowHint(false);
    const r = await api.getNextRiddle();
    setCurrentRiddle(r);
  };

  const handleCheckRiddle = async () => {
    if (!currentRiddle || !riddleAnswer.trim()) return;
    setIsCheckingRiddle(true);
    const res = await api.checkRiddleAnswer(currentRiddle.id, riddleAnswer.trim());
    setRiddleFeedback(res.message);
    setIsCheckingRiddle(false);
  };

  const loadTrivia = async () => {
    setSelectedOption(null);
    setTriviaSubmitted(false);
    const t = await api.getTrivia();
    setTrivia(t);
  };

  const handleSelectOption = (idx: number) => {
    if (triviaSubmitted) return;
    setSelectedOption(idx);
    setTriviaSubmitted(true);
  };

  const handleChooseStoryOption = async (choice: string) => {
    setIsAdvancingStory(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/games/story/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_choice: choice, story_id: 'story-1' }),
      });
      if (res.ok) {
        const data = await res.json();
        setStoryBeat(data);
        setIsAdvancingStory(false);
        return;
      }
    } catch {}
    // Client story branch fallback
    setStoryBeat({
      narrative: `You step forward to: "${choice}". The floor stones gently rotate, uncovering an illuminated path towards an enchanted atrium filled with floating origami fireflies.`,
      options: [
        'Collect one of the origami fireflies in a glass jar',
        'Follow the gentle current of warm air toward the crystal spiral staircase',
      ],
    });
    setIsAdvancingStory(false);
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
        gap: '20px',
      }}
    >
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {[
          { id: 'riddles', label: '🧩 Riddles & Wordplay' },
          { id: 'trivia', label: '🧠 Trivia Challenge' },
          { id: 'story', label: '📖 Co-Creative Story' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="btn-ghost"
            style={{
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--color-primary-400)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary-400)' : 'none',
              borderRadius: '0',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Riddle View */}
      {activeTab === 'riddles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel-elevated"
            style={{ padding: '20px', fontSize: '1.05rem', lineHeight: '1.6' }}
          >
            {currentRiddle?.question || 'Loading riddle...'}
          </div>

          {showHint && currentRiddle?.hints?.[0] && (
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-amber-400)',
                background: 'rgba(251, 191, 36, 0.1)',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(251, 191, 36, 0.25)',
              }}
            >
              💡 Hint: {currentRiddle.hints[0]}
            </div>
          )}

          {riddleFeedback && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: riddleFeedback.includes('Spot on')
                  ? 'rgba(45, 212, 191, 0.15)'
                  : 'rgba(148, 163, 184, 0.15)',
                border: riddleFeedback.includes('Spot on')
                  ? '1px solid var(--color-primary-400)'
                  : '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
              }}
            >
              {riddleFeedback}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={riddleAnswer}
              onChange={(e) => setRiddleAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckRiddle()}
              placeholder="Type your guess here..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleCheckRiddle}
              disabled={isCheckingRiddle || !riddleAnswer.trim()}
              className="btn-primary"
            >
              Check Answer
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setShowHint(!showHint)} className="btn-ghost" style={{ fontSize: '0.825rem' }}>
              {showHint ? 'Hide Hint' : 'Show Hint 💡'}
            </button>
            <button onClick={loadRiddle} className="btn-ghost" style={{ fontSize: '0.825rem' }}>
              Next Riddle ➡️
            </button>
          </div>
        </div>
      )}

      {/* Trivia View */}
      {activeTab === 'trivia' && trivia && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="pill-tag" style={{ width: 'fit-content' }}>
            {trivia.category}
          </div>
          <h3 style={{ fontSize: '1.15rem' }}>{trivia.question}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {trivia.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === trivia.correct_index;

              let btnBg = 'var(--bg-surface-elevated)';
              let border = 'var(--border-subtle)';

              if (triviaSubmitted) {
                if (isCorrect) {
                  btnBg = 'rgba(45, 212, 191, 0.25)';
                  border = '1px solid var(--color-primary-400)';
                } else if (isSelected) {
                  btnBg = 'rgba(239, 68, 68, 0.25)';
                  border = '1px solid #f87171';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="btn-ghost"
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    background: btnBg,
                    border,
                    color: 'var(--text-primary)',
                    cursor: triviaSubmitted ? 'default' : 'pointer',
                  }}
                >
                  <span style={{ fontWeight: 600, marginRight: '8px' }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {triviaSubmitted && (
            <div
              className="glass-panel-elevated"
              style={{
                padding: '14px 18px',
                borderLeft: '4px solid var(--color-amber-400)',
                fontSize: '0.875rem',
              }}
            >
              <strong>✨ Fun Fact:</strong> {trivia.fun_fact}
            </div>
          )}

          {triviaSubmitted && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={loadTrivia} className="btn-primary">
                Next Question ➡️
              </button>
            </div>
          )}
        </div>
      )}

      {/* Story View */}
      {activeTab === 'story' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            className="glass-panel-elevated"
            style={{
              padding: '22px',
              fontSize: '1rem',
              lineHeight: '1.7',
              fontStyle: 'italic',
              borderLeft: '3px solid var(--color-primary-400)',
            }}
          >
            "{storyBeat.narrative}"
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              What path do you choose next?
            </div>
            {storyBeat.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleChooseStoryOption(opt)}
                disabled={isAdvancingStory}
                className="btn-ghost"
                style={{
                  padding: '14px 18px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  lineHeight: '1.4',
                }}
              >
                <span>👉</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
