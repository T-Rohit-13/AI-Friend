import React, { useState } from 'react';

interface GamesViewProps {
  language?: string;
  onSpeak?: (text: string) => void;
  userMood?: string;
}

export const GamesView: React.FC<GamesViewProps> = ({
  language = 'en',
  onSpeak,
  userMood = 'neutral',
}) => {
  const [activeTab, setActiveTab] = useState<'rps' | 'carrom' | 'chess' | 'riddles'>('rps');
  const isTamil = language === 'ta';

  // -------------------------------------------------------------
  // GAME 1: Stone Paper Scissors (Rock Paper Scissors)
  // -------------------------------------------------------------
  const [rpsUserChoice, setRpsUserChoice] = useState<string | null>(null);
  const [rpsAiChoice, setRpsAiChoice] = useState<string | null>(null);
  const [rpsOutcome, setRpsOutcome] = useState<string | null>(null);
  const [rpsScore, setRpsScore] = useState({ user: 0, ai: 0, ties: 0 });
  const [rpsBanter, setRpsBanter] = useState<string>('');

  const speak = (msg: string) => {
    if (onSpeak) onSpeak(msg);
  };

  const playRps = (choice: 'rock' | 'paper' | 'scissors') => {
    setRpsUserChoice(choice);
    const options: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
    // If user is sad or depressed, give them a slight advantage or cheer them up!
    let aiPick: 'rock' | 'paper' | 'scissors';
    if (userMood === 'sad' || userMood === 'anxious' || userMood === 'tired') {
      // 60% chance user wins to lift their spirits!
      const winningPick = choice === 'rock' ? 'scissors' : choice === 'paper' ? 'rock' : 'paper';
      aiPick = Math.random() < 0.6 ? winningPick : options[Math.floor(Math.random() * options.length)];
    } else {
      aiPick = options[Math.floor(Math.random() * options.length)];
    }

    setRpsAiChoice(aiPick);

    let result = '';
    let voiceBanter = '';

    if (choice === aiPick) {
      result = 'tie';
      setRpsScore((prev) => ({ ...prev, ties: prev.ties + 1 }));
      if (isTamil) {
        voiceBanter = 'சமநிலை! நாம் இருவரும் ஒரே மாதிரி சிந்திக்கிறோம் நண்பா! இன்னொரு முறை முயற்சிப்போம்!';
      } else {
        voiceBanter = "It's a tie! Great minds think alike! Let's go again!";
      }
    } else if (
      (choice === 'rock' && aiPick === 'scissors') ||
      (choice === 'paper' && aiPick === 'rock') ||
      (choice === 'scissors' && aiPick === 'paper')
    ) {
      result = 'win';
      setRpsScore((prev) => ({ ...prev, user: prev.user + 1 }));
      if (isTamil) {
        voiceBanter = 'அற்புதம்! நீங்களே வெற்றி பெற்றீர்கள்! உங்கள் ஆட்டம் மிகச் சிறப்பானது! 🎉';
      } else {
        if (userMood === 'sad') {
          voiceBanter = 'Boom! You crushed that round! See, I told you you are awesome! That brought a smile, right? 😄';
        } else {
          voiceBanter = 'You won! Wow, you totally read my mind! You are on fire! 🎉';
        }
      }
    } else {
      result = 'loss';
      setRpsScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
      if (isTamil) {
        voiceBanter = 'ஹா ஹா, இந்த முறை நான் வென்றுவிட்டேன்! கவலைப்படாதீர்கள், அடுத்த முறை நீங்கள் நிச்சயம் வெல்வீர்கள்! 😄';
      } else {
        voiceBanter = 'Haha! My ' + aiPick + ' got you this time! Bet you cannot beat my next move! Try again! 😉';
      }
    }

    setRpsOutcome(result);
    setRpsBanter(voiceBanter);
    speak(voiceBanter);
  };

  // -------------------------------------------------------------
  // GAME 2: Carrom Board Striker Challenge
  // -------------------------------------------------------------
  const [carromScore, setCarromScore] = useState(0);
  const [carromAngle, setCarromAngle] = useState(45);
  const [carromPower, setCarromPower] = useState(70);
  const [carromMessage, setCarromMessage] = useState('');
  const [carromCoins, setCarromCoins] = useState([
    { id: 1, type: 'white', points: 10, pocketed: false },
    { id: 2, type: 'black', points: 5, pocketed: false },
    { id: 3, type: 'queen', points: 25, pocketed: false },
    { id: 4, type: 'white', points: 10, pocketed: false },
    { id: 5, type: 'black', points: 5, pocketed: false },
  ]);

  const strikeCarrom = () => {
    const unpocketed = carromCoins.filter((c) => !c.pocketed);
    if (unpocketed.length === 0) {
      const winMsg = isTamil ? 'அனைத்து காய்களும் பாக்கெட்டில் போடப்பட்டன! நீங்கள் கேரம் சாம்பியன்!' : 'Board Cleared! You are the Carrom Grand Champion! 🏆';
      setCarromMessage(winMsg);
      speak(winMsg);
      return;
    }

    // Hit probability based on power and angle
    const success = Math.random() < (carromPower / 100) * 0.75 + 0.15;
    if (success) {
      const target = unpocketed[Math.floor(Math.random() * unpocketed.length)];
      setCarromCoins((prev) => prev.map((c) => (c.id === target.id ? { ...c, pocketed: true } : c)));
      setCarromScore((prev) => prev + target.points);

      const hitMsg = isTamil
        ? `அருமையான ஸ்ட்ரோக்! ${target.type === 'queen' ? 'சிகப்பு ராணி (Queen)' : target.type} காய் பாக்கெட்டில் விழுந்தது! +${target.points} புள்ளிகள்!`
        : `Spectacular strike! Sunk the ${target.type.toUpperCase()} coin into the pocket! +${target.points} pts! 🎯`;
      setCarromMessage(hitMsg);
      speak(hitMsg);
    } else {
      const missMsg = isTamil
        ? 'காய் நூலிழையில் தவறிவிட்டது! கோணத்தை மாற்றி மீண்டும் அடிக்கவும்!'
        : 'Oof! Rebounded right off the rim! Adjust your striker angle and hit it again!';
      setCarromMessage(missMsg);
      speak(missMsg);
    }
  };

  const resetCarrom = () => {
    setCarromCoins([
      { id: 1, type: 'white', points: 10, pocketed: false },
      { id: 2, type: 'black', points: 5, pocketed: false },
      { id: 3, type: 'queen', points: 25, pocketed: false },
      { id: 4, type: 'white', points: 10, pocketed: false },
      { id: 5, type: 'black', points: 5, pocketed: false },
    ]);
    setCarromScore(0);
    setCarromMessage('');
  };

  // -------------------------------------------------------------
  // GAME 3: Mini-Chess Tactical Puzzle (Blitz)
  // -------------------------------------------------------------
  const [chessMoveIndex, setChessMoveIndex] = useState(0);
  const [chessCommentary, setChessCommentary] = useState('');
  const chessPuzzles = [
    {
      title: isTamil ? 'தந்திரப் புதிர் 1: குதிரை தாக்குதல்' : 'Puzzle 1: Knight Outpost Fork',
      desc: isTamil ? 'கருப்பு அரசன் மற்றும் ராணியை ஒன்றாக தாக்க வெள்ளைக் குதிரையை எங்கு நகர்த்துவீர்கள்?' : 'White to move and fork Black King and Queen!',
      options: ['Nc7+ (Check & Fork)', 'Nf6', 'Nd5'],
      correct: 0,
      praise: isTamil ? 'செக் மற்றும் போர்க்! ராணி வீழ்ந்தது! அற்புதமான சதுரங்க நகர்வு!' : 'BOOM! Nc7+ King and Queen are forked! You captured their Queen! Brilliant move!',
    },
    {
      title: isTamil ? 'தந்திரப் புதிர் 2: பின்வரிசை மேட்' : 'Puzzle 2: Back-Rank Checkmate',
      desc: isTamil ? 'வெள்ளைக் கோட்டை கொண்டு கருப்பு அரசனுக்கு இறுதி செக்மேட் வைக்கவும்!' : 'White to play: Deliver instant back-rank mate with Rook!',
      options: ['Re8# (Checkmate)', 'Ra1', 'Rxd7'],
      correct: 0,
      praise: isTamil ? 'செக்மேட்! எதிரி அரசன் சிக்கிக் கொண்டார்! நீங்கள் வெற்றி பெற்றீர்கள்!' : 'CHECKMATE! The classic back-rank smothered mate! Grandmaster tier play! 👑',
    },
  ];

  const handleChessMove = (idx: number) => {
    const cur = chessPuzzles[chessMoveIndex % chessPuzzles.length];
    if (idx === cur.correct) {
      setChessCommentary(cur.praise);
      speak(cur.praise);
      setTimeout(() => setChessMoveIndex((prev) => prev + 1), 2200);
    } else {
      const oops = isTamil ? 'அந்த நகர்வில் எதிரி தப்பித்து விடுவார்! மீண்டும் கவனமாகப் பாருங்கள்!' : 'Ah, that gives Black an escape square! Look for the most forcing check!';
      setChessCommentary(oops);
      speak(oops);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '26px',
        maxWidth: '740px',
        width: '100%',
        margin: '0 auto',
        borderRadius: '20px',
      }}
    >
      {/* Mood Support Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎮 {isTamil ? 'வேடிக்கை விளையாட்டுகள் (Funny Games)' : 'Interactive Voice Games'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isTamil
              ? 'உங்கள் மனநிலையை உற்சாகப்படுத்த என்னுடன் விளையாடுங்கள்!'
              : 'Designed to lift your spirits, normalize low moods, and share laughs with your AI Friend!'}
          </p>
        </div>
        {userMood && (
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--current-emotion-color)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--current-emotion-color)',
            }}
          >
            Mood Aware: {userMood.toUpperCase()}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          marginBottom: '22px',
          paddingBottom: '4px',
        }}
      >
        <button
          onClick={() => setActiveTab('rps')}
          className={`btn-ghost ${activeTab === 'rps' ? 'btn-active' : ''}`}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: activeTab === 'rps' ? 'var(--color-primary-500)' : 'var(--bg-surface-elevated)',
            color: activeTab === 'rps' ? '#fff' : 'var(--text-primary)',
          }}
        >
          ✂️ {isTamil ? 'கல் காகிதம் கத்தரி' : 'Stone Paper Scissors'}
        </button>
        <button
          onClick={() => setActiveTab('carrom')}
          className={`btn-ghost ${activeTab === 'carrom' ? 'btn-active' : ''}`}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: activeTab === 'carrom' ? 'var(--color-primary-500)' : 'var(--bg-surface-elevated)',
            color: activeTab === 'carrom' ? '#fff' : 'var(--text-primary)',
          }}
        >
          🎯 {isTamil ? 'கேரம் ஸ்ட்ரைக்கர்' : 'Carrom Striker'}
        </button>
        <button
          onClick={() => setActiveTab('chess')}
          className={`btn-ghost ${activeTab === 'chess' ? 'btn-active' : ''}`}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: activeTab === 'chess' ? 'var(--color-primary-500)' : 'var(--bg-surface-elevated)',
            color: activeTab === 'chess' ? '#fff' : 'var(--text-primary)',
          }}
        >
          ♟️ {isTamil ? 'மினி சதுரங்கம்' : 'Mini Chess Blitz'}
        </button>
      </div>

      {/* ========================================================= */}
      {/* GAME 1: STONE PAPER SCISSORS */}
      {/* ========================================================= */}
      {activeTab === 'rps' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            {isTamil ? 'உங்கள் விருப்பத்தை தேர்ந்தெடுக்கவும் (Choose your weapon):' : 'Pick a move or say it in voice call!'}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button
              onClick={() => playRps('rock')}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '20px',
                border: '2px solid rgba(255,255,255,0.15)',
                background: 'var(--bg-surface-elevated)',
                fontSize: '2.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              🪨
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isTamil ? 'கல் (Rock)' : 'Stone'}
              </span>
            </button>

            <button
              onClick={() => playRps('paper')}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '20px',
                border: '2px solid rgba(255,255,255,0.15)',
                background: 'var(--bg-surface-elevated)',
                fontSize: '2.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              📄
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isTamil ? 'காகிதம்' : 'Paper'}
              </span>
            </button>

            <button
              onClick={() => playRps('scissors')}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '20px',
                border: '2px solid rgba(255,255,255,0.15)',
                background: 'var(--bg-surface-elevated)',
                fontSize: '2.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ✂️
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isTamil ? 'கத்தரி' : 'Scissors'}
              </span>
            </button>
          </div>

          {/* Results Box */}
          {rpsOutcome && (
            <div
              style={{
                padding: '18px',
                borderRadius: '16px',
                background: rpsOutcome === 'win' ? 'rgba(16, 185, 129, 0.15)' : rpsOutcome === 'loss' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${rpsOutcome === 'win' ? '#10b981' : rpsOutcome === 'loss' ? '#f87171' : 'var(--border-subtle)'}`,
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
                {rpsOutcome === 'win' ? '🎉 YOU WON!' : rpsOutcome === 'loss' ? '🤖 AI FRIEND WON!' : '🤝 TIE GAME!'}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                You: <strong>{rpsUserChoice?.toUpperCase()}</strong> vs AI Friend: <strong>{rpsAiChoice?.toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{rpsBanter}"
              </div>
            </div>
          )}

          {/* Scoreboard */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <div>🏆 You: <strong style={{ color: '#10b981' }}>{rpsScore.user}</strong></div>
            <div>🤖 AI: <strong style={{ color: '#f87171' }}>{rpsScore.ai}</strong></div>
            <div>🤝 Ties: <strong>{rpsScore.ties}</strong></div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GAME 2: CARROM BOARD STRIKER */}
      {/* ========================================================= */}
      {activeTab === 'carrom' && (
        <div style={{ padding: '10px 0', textAlign: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              height: '360px',
              margin: '0 auto 18px auto',
              backgroundColor: '#d97706',
              borderRadius: '24px',
              border: '12px solid #78350f',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Corner Pockets */}
            <div style={{ position: 'absolute', top: 6, left: 6, width: 34, height: 34, borderRadius: '50%', background: '#1c1917', border: '2px solid #451a03' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 34, height: 34, borderRadius: '50%', background: '#1c1917', border: '2px solid #451a03' }} />
            <div style={{ position: 'absolute', bottom: 6, left: 6, width: 34, height: 34, borderRadius: '50%', background: '#1c1917', border: '2px solid #451a03' }} />
            <div style={{ position: 'absolute', bottom: 6, right: 6, width: 34, height: 34, borderRadius: '50%', background: '#1c1917', border: '2px solid #451a03' }} />

            {/* Center Circle */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px dashed #92400e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Queen */}
              {!carromCoins[2].pocketed && (
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: '2px solid #fca5a5', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} title="Red Queen" />
              )}
            </div>

            {/* Remaining Coins on Board */}
            {carromCoins.filter((c) => !c.pocketed && c.id !== 3).map((c, idx) => (
              <div
                key={c.id}
                style={{
                  position: 'absolute',
                  top: 140 + (idx % 2 === 0 ? -25 : 25),
                  left: 140 + (idx < 2 ? -25 : 25),
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: c.type === 'white' ? '#fef08a' : '#1e293b',
                  border: '2px solid rgba(0,0,0,0.5)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            ))}

            {/* Striker Base Line */}
            <div style={{ position: 'absolute', bottom: 45, width: '220px', height: '2px', background: 'rgba(0,0,0,0.4)' }}>
              <div style={{ position: 'absolute', left: `${carromAngle}%`, top: -11, width: 26, height: 26, borderRadius: '50%', background: '#38bdf8', border: '3px solid #ffffff', cursor: 'grab' }} title="Striker" />
            </div>
          </div>

          {/* Controls */}
          <div style={{ maxWidth: '380px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>{isTamil ? 'அடிக்கும் கோணம் (Angle)' : 'Aim Striker Position'}:</span>
                <span>{carromAngle}°</span>
              </label>
              <input
                type="range"
                min="10"
                max="90"
                value={carromAngle}
                onChange={(e) => setCarromAngle(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>{isTamil ? 'அடிக்கும் சக்தி (Power)' : 'Strike Power'}:</span>
                <span>{carromPower}%</span>
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={carromPower}
                onChange={(e) => setCarromPower(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={strikeCarrom}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-amber-500))',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🎯 {isTamil ? 'அடிக்கவும் (Flick Striker)' : 'Strike Coin!'}
              </button>
              <button
                onClick={resetCarrom}
                className="btn-ghost"
                style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
              >
                🔄 Reset
              </button>
            </div>

            {/* Commentary Banner */}
            {carromMessage && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                }}
              >
                🗣️ "{carromMessage}"
              </div>
            )}

            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isTamil ? 'மதிப்பெண்' : 'Total Score'}: <span style={{ color: '#fbbf24', fontSize: '1.1rem' }}>{carromScore} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GAME 3: MINI CHESS BLITZ PUZZLES */}
      {/* ========================================================= */}
      {activeTab === 'chess' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          {(() => {
            const puzzle = chessPuzzles[chessMoveIndex % chessPuzzles.length];
            return (
              <div style={{ maxWidth: '440px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
                  {puzzle.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  {puzzle.desc}
                </p>

                {/* Mini Board Graphic */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '2px',
                    width: '240px',
                    height: '240px',
                    margin: '0 auto 20px auto',
                    border: '4px solid #475569',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  {Array.from({ length: 16 }).map((_, i) => {
                    const row = Math.floor(i / 4);
                    const col = i % 4;
                    const isDark = (row + col) % 2 === 1;
                    return (
                      <div
                        key={i}
                        style={{
                          backgroundColor: isDark ? '#64748b' : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        {i === 0 && '♚'}
                        {i === 2 && '♛'}
                        {i === 9 && '♘'}
                        {i === 15 && '♔'}
                      </div>
                    );
                  })}
                </div>

                {/* Move Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {puzzle.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChessMove(idx)}
                      style={{
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary-400)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Commentary */}
                {chessCommentary && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--color-primary-500)',
                      fontSize: '0.9rem',
                      fontStyle: 'italic',
                    }}
                  >
                    🗣️ "{chessCommentary}"
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
