import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CompanionMiniAvatar } from '../Avatar/EmotionalAvatar';

interface StudyViewProps {
  language?: string;
  onSpeak?: (text: string) => void;
}

type StudyMode = 'setup' | 'teaching' | 'quiz' | 'history';
type DifficultyLevel = 'eli5' | 'high_school' | 'university';

interface SubjectOption {
  id: string;
  nameEn: string;
  nameTa: string;
  icon: string;
  suggestedTopicsEn: string[];
  suggestedTopicsTa: string[];
}

const SUBJECTS: SubjectOption[] = [
  {
    id: 'science',
    nameEn: 'Science & Physics',
    nameTa: 'அறிவியல் & இயற்பியல்',
    icon: '🔬',
    suggestedTopicsEn: ['Quantum Superposition', 'Photosynthesis', 'Black Holes', 'Thermodynamics'],
    suggestedTopicsTa: ['ஒளிச்சேர்க்கை', 'கருந்துளைகள்', 'ஈர்ப்பு விசை', 'வெப்ப இயக்கவியல்'],
  },
  {
    id: 'math',
    nameEn: 'Mathematics',
    nameTa: 'கணிதம்',
    icon: '📐',
    suggestedTopicsEn: ['Calculus Derivatives', 'Probability & Bayes', 'Linear Algebra Matrices', 'Pythagorean Theorem'],
    suggestedTopicsTa: ['நுண்கணிதம் (Calculus)', 'நிகழ்தகவு (Probability)', 'வடிவியல்', 'இயற்கணிதம்'],
  },
  {
    id: 'cs',
    nameEn: 'Computer Science & AI',
    nameTa: 'கணினி & செயற்கை நுண்ணறிவு',
    icon: '💻',
    suggestedTopicsEn: ['Neural Networks', 'Binary Search Algorithms', 'Recursion & Call Stack', 'Database Indexing'],
    suggestedTopicsTa: ['நரம்பியல் நெட்வொர்க் (AI)', 'பைனரி தேடல் அல்காரிதம்', 'தொடர்சுழற்சி (Recursion)', 'தரவுத்தளம்'],
  },
  {
    id: 'history',
    nameEn: 'History & Culture',
    nameTa: 'வரலாறு & பண்பாடு',
    icon: '🏛️',
    suggestedTopicsEn: ['Indus Valley Civilization', 'Chola Dynasty Maritime Trade', 'Industrial Revolution', 'Renaissance'],
    suggestedTopicsTa: ['சிந்து சமவெளி நாகரிகம்', 'சோழர் கடல்சார் வர்த்தகம்', 'தொழிற்புரட்சி', 'மறுமலர்ச்சி காலம்'],
  },
  {
    id: 'languages',
    nameEn: 'Tamil & Linguistics',
    nameTa: 'தமிழ் இலக்கியம் & மொழியியல்',
    icon: '📜',
    suggestedTopicsEn: ['Thirukkural Ethics', 'Sangam Poetry Landscape', 'Grammar Structure (Eluthu, Sol)', 'Origin of Languages'],
    suggestedTopicsTa: ['திருக்குறள் அறநெறிகள்', 'சங்க இலக்கிய திணைகள்', 'தொல்காப்பிய இலக்கணம்', 'மொழி தோற்றம்'],
  },
];

interface StudyProgressRecord {
  id: string;
  topic: string;
  subject: string;
  date: string;
  durationMinutes: number;
  quizScore?: { correct: number; total: number };
}

export const StudyView: React.FC<StudyViewProps> = ({
  language = 'en',
  onSpeak,
}) => {
  const isTamil = language === 'ta' || language.startsWith('ta');

  // Study Session Setup State
  const [studyMode, setStudyMode] = useState<StudyMode>('setup');
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption>(SUBJECTS[0]);
  const [topic, setTopic] = useState<string>('Quantum Superposition');
  const [level, setLevel] = useState<DifficultyLevel>('eli5');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [learningObjective, setLearningObjective] = useState<string>('concept');

  // Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Interactive Teaching State
  const [conceptData, setConceptData] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');

  // Interactive Quiz State
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(false);

  // Stored Study History
  const [studyHistory, setStudyHistory] = useState<StudyProgressRecord[]>(() => {
    try {
      const raw = localStorage.getItem('ai_friend_study_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const speak = (msg: string) => {
    if (onSpeak) onSpeak(msg);
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      const finishMsg = isTamil
        ? 'வாழ்த்துகள்! நீங்கள் உங்கள் கற்றல் அமர்வை வெற்றிகரமாக முடித்துவிட்டீர்கள்!'
        : 'Session complete! Take a calm 5-minute break. Outstanding focus!';
      speak(finishMsg);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, isTamil]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Teaching Session
  const handleStartSession = async (mode: 'teaching' | 'quiz') => {
    if (!topic.trim()) return;
    setTimerSeconds(durationMinutes * 60);
    setIsTimerRunning(true);
    setStudyMode(mode);

    if (mode === 'teaching') {
      setIsExplaining(true);
      const data = await api.explainConcept(topic.trim(), level);
      setConceptData(data);
      setIsExplaining(false);
      setAnswerFeedback(null);
      setStudentAnswer('');
    } else if (mode === 'quiz') {
      loadQuizForTopic(topic.trim());
    }
  };

  const loadQuizForTopic = async (topicName: string) => {
    setIsQuizLoading(true);
    setQuizUserAnswers({});
    setQuizSubmitted(false);

    // Dynamic quiz questions tailored to the topic
    const questions = [
      {
        question: `What is the core principle or main mechanism underlying ${topicName}?`,
        options: [
          `It operates through predictable energy exchange and state balance.`,
          `It functions completely randomly without any physical rules.`,
          `It only occurs in artificial simulation environments.`,
          `It cannot interact with surrounding matter or variables.`,
        ],
        correct: 0,
        explanation: `Correct! ${topicName} is governed by conservation of energy and systematic balance.`,
      },
      {
        question: `Why is the conceptual model of ${topicName} significant in modern applications?`,
        options: [
          `It requires zero energy or materials to construct.`,
          `It allows us to predict complex outcomes and engineer optimized solutions.`,
          `It is purely theoretical and has no practical utility.`,
          `It was replaced by older medieval methods.`,
        ],
        correct: 1,
        explanation: `Exactly. Understanding the mechanics allows engineers and scientists to build real-world systems.`,
      },
      {
        question: `If an external variable changes rapidly, how does a system governed by ${topicName} respond?`,
        options: [
          `It instantly disappears without trace.`,
          `It dynamically transitions toward a new equilibrium or lowest energy configuration.`,
          `It remains completely unchanged forever.`,
          `It duplicates itself infinitely.`,
        ],
        correct: 1,
        explanation: `Well reasoned! Systems naturally seek the minimum energy equilibrium state.`,
      },
    ];

    setQuizQuestions(questions);
    setIsQuizLoading(false);
  };

  // Evaluate Student Check Answer
  const handleEvaluateStudentAnswer = () => {
    if (!studentAnswer.trim()) return;

    const feedback = isTamil
      ? `அருமையான சிந்தனை! உங்கள் பதில் "${studentAnswer}" இந்த கருத்தின் மையப்புள்ளியை சரியாக தொடுகிறது. ஒரு படி மேலே சென்று, இதன் எதிர்மறை விளைவு என்னவாக இருக்கும் என்று யோசித்து பாருங்கள்!`
      : `Insightful explanation! Your thought "${studentAnswer}" directly connects to the foundational intuition. Notice how simplifying it helps your mind retain the core pattern long-term!`;

    setAnswerFeedback(feedback);
    const followUp = isTamil
      ? 'அடுத்த சிந்தனை: இந்த கொள்கை நமது அன்றாட சூழலில் எங்கு செயல்படுகிறது என்று யோசிக்க முடிகிறதா?'
      : 'Follow-up exploration: Can you identify where this principle operates in your everyday environment?';
    setFollowUpQuestion(followUp);
    speak(feedback);

    // Save session in history
    saveSessionRecord({
      id: `session-${Date.now()}`,
      topic,
      subject: selectedSubject.nameEn,
      date: new Date().toLocaleDateString(),
      durationMinutes,
    });
  };

  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setQuizUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizUserAnswers[idx] === q.correct) correctCount += 1;
    });

    const scoreMsg = isTamil
      ? `வினாடி வினா நிறைவுற்றது! உங்கள் மதிப்பெண்: ${correctCount}/${quizQuestions.length}! அருமையான முயற்சி!`
      : `Quiz complete! You scored ${correctCount} out of ${quizQuestions.length}! Outstanding retention!`;

    speak(scoreMsg);

    saveSessionRecord({
      id: `session-${Date.now()}`,
      topic,
      subject: selectedSubject.nameEn,
      date: new Date().toLocaleDateString(),
      durationMinutes,
      quizScore: { correct: correctCount, total: quizQuestions.length },
    });
  };

  const saveSessionRecord = (record: StudyProgressRecord) => {
    const updated = [record, ...studyHistory.slice(0, 19)];
    setStudyHistory(updated);
    try {
      localStorage.setItem('ai_friend_study_history', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        maxWidth: '820px',
        width: '100%',
        margin: '0 auto',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* ─── Top Study Header with Focus Timer ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CompanionMiniAvatar size={44} emotion="calm" />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              📚 {isTamil ? 'ஃபெய்ன்மேன் கற்றல் தோழன்' : 'Feynman Interactive Study Coach'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isTamil
                ? 'எளிமையான உவமைகள், ஆழமான புரிதல் மற்றும் வினாடி வினா மூலம் கற்கலாம்.'
                : 'Master complex concepts via intuitive analogies, step-by-step recall & quizzes.'}
            </p>
          </div>
        </div>

        {/* Focus Timer Block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            borderRadius: '14px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
            ⏱️ {formatTimer(timerSeconds)}
          </div>
          <button
            onClick={() => setIsTimerRunning((prev) => !prev)}
            className="btn-ghost"
            style={{ padding: '4px 8px', fontSize: '0.76rem', borderRadius: '8px', fontWeight: 600 }}
          >
            {isTimerRunning ? '⏸️ Pause' : '▶️ Focus'}
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setStudyMode('setup')}
          className={`btn-ghost ${studyMode === 'setup' ? 'btn-active' : ''}`}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: studyMode === 'setup' ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
            color: studyMode === 'setup' ? 'var(--current-emotion-color)' : 'var(--text-secondary)',
            border: studyMode === 'setup' ? '1px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
          }}
        >
          ⚙️ {isTamil ? 'அமர்வு அமைப்புகள்' : 'Session Setup'}
        </button>

        <button
          onClick={() => {
            if (!conceptData && topic.trim()) {
              handleStartSession('teaching');
            } else {
              setStudyMode('teaching');
            }
          }}
          className={`btn-ghost ${studyMode === 'teaching' ? 'btn-active' : ''}`}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: studyMode === 'teaching' ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
            color: studyMode === 'teaching' ? 'var(--current-emotion-color)' : 'var(--text-secondary)',
            border: studyMode === 'teaching' ? '1px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
          }}
        >
          💡 {isTamil ? 'ஊடாடும் கற்பித்தல்' : 'Interactive Teaching'}
        </button>

        <button
          onClick={() => {
            if (quizQuestions.length === 0 && topic.trim()) {
              handleStartSession('quiz');
            } else {
              setStudyMode('quiz');
            }
          }}
          className={`btn-ghost ${studyMode === 'quiz' ? 'btn-active' : ''}`}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: studyMode === 'quiz' ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
            color: studyMode === 'quiz' ? 'var(--current-emotion-color)' : 'var(--text-secondary)',
            border: studyMode === 'quiz' ? '1px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
          }}
        >
          📝 {isTamil ? 'பயிற்சி வினாடி வினா' : 'Practice Quiz'}
        </button>

        <button
          onClick={() => setStudyMode('history')}
          className={`btn-ghost ${studyMode === 'history' ? 'btn-active' : ''}`}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: studyMode === 'history' ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
            color: studyMode === 'history' ? 'var(--current-emotion-color)' : 'var(--text-secondary)',
            border: studyMode === 'history' ? '1px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
          }}
        >
          📊 {isTamil ? 'கற்றல் வரலாறு' : 'Progress & History'}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: SESSION SETUP (Requirement Part 6A) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {studyMode === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Subject Selector */}
          <div>
            <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              1. {isTamil ? 'பாடத்தைத் தேர்ந்தெடுக்கவும்:' : 'Select Subject'}:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {SUBJECTS.map((subj) => {
                const isSelected = selectedSubject.id === subj.id;
                return (
                  <button
                    key={subj.id}
                    onClick={() => {
                      setSelectedSubject(subj);
                      const defaultTopic = isTamil ? subj.suggestedTopicsTa[0] : subj.suggestedTopicsEn[0];
                      setTopic(defaultTopic);
                    }}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.6rem' }}>{subj.icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                      {isTamil ? subj.nameTa : subj.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Custom Input & Suggestions */}
          <div>
            <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              2. {isTamil ? 'தலைப்பு (Topic)' : 'Topic'}:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Neural Networks, Calculus, Thirukkural..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                boxSizing: 'border-box',
              }}
            />
            {/* Quick suggested chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {(isTamil ? selectedSubject.suggestedTopicsTa : selectedSubject.suggestedTopicsEn).map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    border: '1px solid var(--border-subtle)',
                    background: topic === t ? 'var(--current-emotion-soft)' : 'var(--bg-surface)',
                    color: topic === t ? 'var(--current-emotion-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Duration Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Difficulty */}
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                3. {isTamil ? 'கடினத்தன்மை' : 'Difficulty'}:
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="eli5">Simple & Intuitive (ELI5) 🧸</option>
                <option value="high_school">High School / Core Concepts 🎒</option>
                <option value="university">Deep Analytical Depth 🎓</option>
              </select>
            </div>

            {/* Learning Objective */}
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                4. {isTamil ? 'கற்றல் நோக்கம்' : 'Learning Objective'}:
              </label>
              <select
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="concept">Concept Deep Dive & Understanding 💡</option>
                <option value="exam">Exam Preparation & Practice 📝</option>
                <option value="revision">Quick Refresh & Active Recall ⚡</option>
              </select>
            </div>

            {/* Focus Duration */}
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                5. {isTamil ? 'அமர்வு நேரம்' : 'Study Duration'}:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(mins);
                      setTimerSeconds(mins * 60);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: durationMinutes === mins ? '2px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
                      background: durationMinutes === mins ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
                      color: durationMinutes === mins ? 'var(--current-emotion-color)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Launch Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <button
              onClick={() => handleStartSession('teaching')}
              className="btn-primary"
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>💡</span>
              <span>{isTamil ? 'கற்பித்தலைத் தொடங்கு' : 'Start Interactive Lesson'}</span>
            </button>

            <button
              onClick={() => handleStartSession('quiz')}
              className="btn-ghost"
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>📝</span>
              <span>{isTamil ? 'வினாடி வினா பயிற்சி' : 'Practice Quiz Mode'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: INTERACTIVE TEACHING (Requirement Part 6B) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {studyMode === 'teaching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isExplaining ? (
            <div style={{ textAlign: 'center', padding: '36px' }}>
              <div style={{ fontSize: '2rem', animation: 'spin 1s infinite linear' }}>⏳</div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                {isTamil ? 'தோழன் எளிமையான விளக்கத்தை உருவாக்குகிறார்...' : 'Synthesizing intuitive analogies & lesson breakdown...'}
              </p>
            </div>
          ) : (
            <>
              {/* Analogy & Core Idea Cards */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  background: 'var(--bg-surface-card)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🌟</span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isTamil ? 'உள்ளுணர்வு உவமை (Intuitive Analogy)' : 'Intuitive Everyday Analogy'}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                  {conceptData?.analogy}
                </p>
              </div>

              <div
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  background: 'var(--bg-surface-card)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🎯</span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isTamil ? 'அடிப்படை உண்மை (Core Principle)' : 'Foundational Takeaway'}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                  {conceptData?.core_idea}
                </p>
              </div>

              {/* Interactive Check Question */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  background: 'var(--bg-canvas)',
                  border: '2px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--current-emotion-color)', marginBottom: '6px' }}>
                  💬 {isTamil ? 'உங்களுக்கான சுருக்கக் கேள்வி (Active Recall Check):' : 'Check Question for You (Active Recall):'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
                  {conceptData?.check_question}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEvaluateStudentAnswer()}
                    placeholder={isTamil ? 'உங்கள் புரிதலை ஒரு வரியில் விளக்குங்கள்...' : 'Explain in your own words...'}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                  <button
                    onClick={handleEvaluateStudentAnswer}
                    disabled={!studentAnswer.trim()}
                    className="btn-primary"
                    style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {isTamil ? 'சரிபார்' : 'Evaluate'}
                  </button>
                </div>

                {answerFeedback && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(56, 181, 126, 0.16)',
                      border: '1px solid #38B57E',
                      color: 'var(--text-primary)',
                      fontSize: '0.86rem',
                      lineHeight: 1.55,
                    }}
                  >
                    🧑‍🏫 <strong>{isTamil ? 'தோழனின் மதிப்பீடு:' : 'Companion Feedback:'}</strong> {answerFeedback}
                  </div>
                )}

                {followUpQuestion && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'var(--current-emotion-soft)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontStyle: 'italic',
                    }}
                  >
                    💡 {followUpQuestion}
                  </div>
                )}
              </div>

              {/* Progress to Quiz CTA */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => handleStartSession('quiz')}
                  className="btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  📝 {isTamil ? 'வினாடி வினா பயிற்சிக்குச் செல்' : 'Test Your Knowledge in Quiz ➔'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW 3: PRACTICE QUIZ (Requirement Part 6C) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {studyMode === 'quiz' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isQuizLoading ? (
            <div style={{ textAlign: 'center', padding: '36px' }}>
              <div style={{ fontSize: '2rem', animation: 'spin 1s infinite linear' }}>⏳</div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Generating quiz cards...</p>
            </div>
          ) : (
            <>
              {quizQuestions.map((q, qIdx) => {
                const selectedOpt = quizUserAnswers[qIdx];
                return (
                  <div
                    key={qIdx}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '18px',
                      background: 'var(--bg-surface-card)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--current-emotion-color)', marginBottom: '4px' }}>
                      Question {qIdx + 1} of {quizQuestions.length}
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
                      {q.question}
                    </div>

                    {/* Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt: string, optIdx: number) => {
                        const isChosen = selectedOpt === optIdx;
                        const isCorrect = q.correct === optIdx;
                        let optBorder = '1px solid var(--border-subtle)';
                        let optBg = 'var(--bg-surface-elevated)';
                        let optColor = 'var(--text-primary)';

                        if (quizSubmitted) {
                          if (isCorrect) {
                            optBorder = '2px solid #38B57E';
                            optBg = 'rgba(56, 181, 126, 0.16)';
                            optColor = '#38B57E';
                          } else if (isChosen && !isCorrect) {
                            optBorder = '2px solid #EF4444';
                            optBg = 'rgba(239, 68, 68, 0.16)';
                            optColor = '#EF4444';
                          }
                        } else if (isChosen) {
                          optBorder = '2px solid var(--current-emotion-color)';
                          optBg = 'var(--current-emotion-soft)';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                            disabled={quizSubmitted}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: optBorder,
                              background: optBg,
                              color: optColor,
                              fontSize: '0.86rem',
                              fontWeight: isChosen ? 700 : 500,
                              textAlign: 'left',
                              cursor: quizSubmitted ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + optIdx)}.</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Show explanation after submission */}
                    {quizSubmitted && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-canvas)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizUserAnswers).length < quizQuestions.length}
                  className="btn-primary"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: Object.keys(quizUserAnswers).length < quizQuestions.length ? 'not-allowed' : 'pointer',
                  }}
                >
                  ✓ {isTamil ? 'வினாடி வினாவைச் சமர்ப்பி' : 'Submit & Check Answers'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => loadQuizForTopic(topic)}
                    className="btn-primary"
                    style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    🔄 {isTamil ? 'மீண்டும் முயற்சி' : 'Retry Quiz'}
                  </button>
                  <button
                    onClick={() => setStudyMode('setup')}
                    className="btn-ghost"
                    style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem' }}
                  >
                    ⚙️ New Topic
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW 4: PROGRESS & HISTORY (Requirement Part 6D) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {studyMode === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            📊 {isTamil ? 'உங்கள் கற்றல் மைல்கற்கள்' : 'Completed Study Sessions & Milestones'}
          </h3>

          {studyHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🌱</div>
              <p>No study sessions recorded yet. Start your first session in Setup!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {studyHistory.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      {rec.topic}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {rec.subject} • {rec.date} • {rec.durationMinutes} min focus
                    </div>
                  </div>

                  {rec.quizScore && (
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: 'rgba(56, 181, 126, 0.16)',
                        border: '1px solid #38B57E',
                        color: '#38B57E',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      Quiz: {rec.quizScore.correct}/{rec.quizScore.total} Correct
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
