import React, { useState, useEffect } from 'react';
import { CompanionMiniAvatar } from '../Avatar/EmotionalAvatar';

interface GamesViewProps {
  language?: string;
  onSpeak?: (text: string) => void;
  userMood?: string;
}

type ActiveGame = 'lobby' | 'tictactoe' | 'rps' | 'riddles' | 'memory' | 'wordguess';
type TttDifficulty = 'easy' | 'normal' | 'unbeatable';

interface RiddleItem {
  id: string;
  questionEn: string;
  questionTa: string;
  answerEn: string;
  answerTa: string;
  hintsEn: [string, string];
  hintsTa: [string, string];
  optionsEn: string[];
  optionsTa: string[];
}

interface WordGuessItem {
  id: string;
  wordEn: string;
  wordTa: string;
  categoryEn: string;
  categoryTa: string;
  clueEn: string;
  clueTa: string;
}

const WORD_GUESS_DATA: WordGuessItem[] = [
  {
    id: 'w1',
    wordEn: 'FRIEND',
    wordTa: 'தோழமை',
    categoryEn: 'Emotional Bond',
    categoryTa: 'அன்பின் பந்தம்',
    clueEn: 'A person with whom one has a bond of mutual affection, trust and support.',
    clueTa: 'எப்போதும் உடனிருந்து ஆறுதல் தரும் உற்ற தோழர்.',
  },
  {
    id: 'w2',
    wordEn: 'SMILE',
    wordTa: 'புன்னகை',
    categoryEn: 'Expression of Joy',
    categoryTa: 'மகிழ்ச்சியின் வெளிப்பாடு',
    clueEn: 'A pleased or amused facial expression with upturned corners of the mouth.',
    clueTa: 'மனதில் மகிழ்ச்சி பிறக்கும் போது முகத்தில் தோன்றும் அழகு.',
  },
  {
    id: 'w3',
    wordEn: 'PEACE',
    wordTa: 'அமைதி',
    categoryEn: 'Mental Harmony',
    categoryTa: 'மன அமைதி',
    clueEn: 'Freedom from disturbance, tranquility and quiet serenity.',
    clueTa: 'அமைதியும் நிம்மதியும் நிறைந்த ஆனந்த நிலை.',
  },
  {
    id: 'w4',
    wordEn: 'HOPE',
    wordTa: 'நம்பிக்கை',
    categoryEn: 'Inner Strength',
    categoryTa: 'உள் வலிமை',
    clueEn: 'A feeling of expectation and desire for a certain good thing to happen.',
    clueTa: 'எதிர்காலம் சிறப்பாகும் என்ற ஆழ்ந்த நம்பிக்கை.',
  },
  {
    id: 'w5',
    wordEn: 'COURAGE',
    wordTa: 'தைரியம்',
    categoryEn: 'Bravery & Resolve',
    categoryTa: 'வீரம் & மன உறுதி',
    clueEn: 'The ability to confront fear, pain, danger, or uncertainty with resolve.',
    clueTa: 'துணிவோடு சவால்களை எதிர்கொள்ளும் நெஞ்சுரம்.',
  },
];

const RIDDLES_DATA: RiddleItem[] = [
  {
    id: 'r1',
    questionEn: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
    questionTa: 'வாயின்றி பேசுவேன், காதின்றி கேட்பேன். உடலின்றி காற்றோடு உயிர்பெறுவேன். நான் யார்?',
    answerEn: 'echo',
    answerTa: 'எதிரொலி',
    hintsEn: ['It repeats exactly what you shout.', 'You often hear it in large empty caves or mountain cliffs.'],
    hintsTa: ['நீங்கள் கூப்பிடுவதை அப்படியே திருப்பிக் கூறும்.', 'பெரிய குகைகள் அல்லது மலைகளில் இது கேட்கும்.'],
    optionsEn: ['An Echo', 'A Cloud', 'A Flute', 'A Shadow'],
    optionsTa: ['எதிரொலி', 'மேகம்', 'புல்லாங்குழல்', 'நிழல்'],
  },
  {
    id: 'r2',
    questionEn: 'The more you take away from me, the bigger I become. What am I?',
    questionTa: 'என்னிடம் இருந்து எவ்வளவுக்கு எவ்வளவு எடுக்கிறீர்களோ, அவ்வளவுக்கு அவ்வளவு நான் பெரிதாவேன். நான் யார்?',
    answerEn: 'hole',
    answerTa: 'குழி',
    hintsEn: ['Think about digging in soft sand or dirt.', 'You might find one in an old sock or in a garden path.'],
    hintsTa: ['மணலில் அல்லது தரையில் தோண்டுவதை நினைத்துப் பாருங்கள்.', 'பழைய காலுறையிலோ அல்லது தரையிலோ இதைக் காணலாம்.'],
    optionsEn: ['A Hole', 'A Mountain', 'A Shadow', 'A Sponge'],
    optionsTa: ['குழி', 'மலை', 'நிழல்', 'ஸ்பாஞ்ச்'],
  },
  {
    id: 'r3',
    questionEn: 'What has keys, but no locks; space, but no room; you can enter, but cannot go inside?',
    questionTa: 'விசைகள் உண்டு ஆனால் பூட்டு இல்லை; ஸ்பேஸ் உண்டு ஆனால் அறை இல்லை; உள்ளிடலாம் ஆனால் நுழைய முடியாது. நான் யார்?',
    answerEn: 'keyboard',
    answerTa: 'விசைப்பலகை',
    hintsEn: ['You are very likely looking at or touching one right now.', 'It has letters, numbers, Spacebar, and Enter.'],
    hintsTa: ['இப்போது கூட நீங்கள் இதை பார்த்துக் கொண்டிருக்கலாம்.', 'இதில் எழுத்துக்கள், எண்கள் மற்றும் என்டர் விசை இருக்கும்.'],
    optionsEn: ['A Keyboard', 'A Piano', 'A Locked Chest', 'A Starship'],
    optionsTa: ['விசைப்பலகை (Keyboard)', 'பியானோ', 'பூட்டிய பெட்டி', 'விண்கலம்'],
  },
  {
    id: 'r4',
    questionEn: 'What can travel all around the world while remaining stationed in the same corner?',
    questionTa: 'ஒரே மூலையிலேயே அமர்ந்திருந்தாலும் உலகம் முழுவதும் சுற்றி வரும் பொருள் எது?',
    answerEn: 'stamp',
    answerTa: 'தபால் தலை',
    hintsEn: ['You affix it to an envelope or postcard.', 'It is small, square, paper-thin, and carries letters.'],
    hintsTa: ['கடித உறையின் மூலையில் இதை ஒட்டுவார்கள்.', 'சிறிய சதுர காகிதத் துண்டு.'],
    optionsEn: ['A Postage Stamp', 'A Compass', 'A Passport', 'A Satellite'],
    optionsTa: ['தபால் தலை (Postage Stamp)', 'திசைகாட்டி', 'பாஸ்போர்ட்', 'செயற்கைக்கோள்'],
  },
  {
    id: 'r5',
    questionEn: 'What has hands and a face, but cannot hold anything or smile?',
    questionTa: 'முகம் உண்டு, கைகளும் உண்டு; ஆனால் எதையும் பிடிக்க முடியாது, சிரிக்கவும் முடியாது. நான் யார்?',
    answerEn: 'clock',
    answerTa: 'கடிகாரம்',
    hintsEn: ['It ticks constantly and tells you when to wake up.', 'Its hands point to 12 numbers in a circle.'],
    hintsTa: ['இது டிக் டிக் என்று ஓடிக்கொண்டே இருக்கும்.', 'இதில் இரண்டு அல்லது மூன்று முட்கள் இருக்கும்.'],
    optionsEn: ['A Clock', 'A Robot', 'A Mirror', 'A Statue'],
    optionsTa: ['கடிகாரம் (Clock)', 'ரோபோ', 'கண்ணாடி', 'சிலை'],
  },
];

export const GamesView: React.FC<GamesViewProps> = ({
  language = 'en',
  onSpeak,
  userMood = 'neutral',
}) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>('lobby');
  const isTamil = language === 'ta' || language.startsWith('ta');

  const speak = (msg: string) => {
    if (onSpeak) onSpeak(msg);
  };

  // ═══════════════════════════════════════════════════════════════
  // GAME 1: TIC-TAC-TOE VS REAL AI BOT (MINIMAX ENGINE)
  // ═══════════════════════════════════════════════════════════════
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isUserTurn, setIsUserTurn] = useState<boolean>(true);
  const [tttWinner, setTttWinner] = useState<string | null>(null); // 'user', 'ai', 'draw', or null
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [tttDifficulty, setTttDifficulty] = useState<TttDifficulty>('normal');
  const [tttScore, setTttScore] = useState({ user: 0, ai: 0, draws: 0 });
  const [tttCommentary, setTttCommentary] = useState<string>('');

  const WINNING_COMBOS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const checkWinner = (currentBoard: (string | null)[]) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'draw', combo: null };
    }
    return null;
  };

  // Minimax evaluation for unbeatable AI opponent
  const minimax = (newBoard: (string | null)[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(newBoard);
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      if (result.winner === 'draw') return 0;
    }

    const availableMoves = newBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of availableMoves) {
        newBoard[move] = 'O';
        const evaluation = minimax(newBoard, depth + 1, false);
        newBoard[move] = null;
        maxEval = Math.max(maxEval, evaluation);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of availableMoves) {
        newBoard[move] = 'X';
        const evaluation = minimax(newBoard, depth + 1, true);
        newBoard[move] = null;
        minEval = Math.min(minEval, evaluation);
      }
      return minEval;
    }
  };

  const getBestAiMove = (currentBoard: (string | null)[], difficulty: TttDifficulty): number => {
    const availableMoves = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (availableMoves.length === 0) return -1;

    // Easy mode: 65% random move, 35% smart
    if (difficulty === 'easy' && Math.random() < 0.65) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // Normal mode: blocks immediate user win or completes bot win, else 40% random
    if (difficulty === 'normal') {
      // 1. Can bot win on this move?
      for (const move of availableMoves) {
        const copy = [...currentBoard];
        copy[move] = 'O';
        if (checkWinner(copy)?.winner === 'O') return move;
      }
      // 2. Can user win on next move? Block them!
      for (const move of availableMoves) {
        const copy = [...currentBoard];
        copy[move] = 'X';
        if (checkWinner(copy)?.winner === 'X') return move;
      }
      if (Math.random() < 0.4) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }

    // Unbeatable / Optimal Minimax
    let bestScore = -Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
      currentBoard[move] = 'O';
      const score = minimax(currentBoard, 0, false);
      currentBoard[move] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  };

  // Bot Turn Effect
  useEffect(() => {
    if (!isUserTurn && !tttWinner && activeGame === 'tictactoe') {
      const timer = setTimeout(() => {
        const aiMoveIndex = getBestAiMove([...board], tttDifficulty);
        if (aiMoveIndex !== -1) {
          const nextBoard = [...board];
          nextBoard[aiMoveIndex] = 'O';
          setBoard(nextBoard);

          const winInfo = checkWinner(nextBoard);
          if (winInfo) {
            if (winInfo.winner === 'O') {
              setTttWinner('ai');
              setWinningLine(winInfo.combo);
              setTttScore((s) => ({ ...s, ai: s.ai + 1 }));
              const msg = isTamil
                ? 'நான் வென்றுவிட்டேன்! அருமையான ஆட்டம் நண்பா! இன்னொரு முறை விளையாடலாமா?'
                : 'I got three in a row! Great game! Would you like a rematch?';
              setTttCommentary(msg);
              speak(msg);
            } else if (winInfo.winner === 'draw') {
              setTttWinner('draw');
              setTttScore((s) => ({ ...s, draws: s.draws + 1 }));
              const msg = isTamil
                ? 'சமநிலை! நாம் இருவரும் சம பலத்துடன் விளையாடினோம்!'
                : "It's a draw! Cat's game! Both of us defended brilliantly!";
              setTttCommentary(msg);
              speak(msg);
            }
          } else {
            setIsUserTurn(true);
          }
        }
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [isUserTurn, tttWinner, activeGame, board, tttDifficulty, isTamil]);

  const handleCellClick = (index: number) => {
    if (!isUserTurn || board[index] !== null || tttWinner) return;

    const nextBoard = [...board];
    nextBoard[index] = 'X';
    setBoard(nextBoard);

    const winInfo = checkWinner(nextBoard);
    if (winInfo) {
      if (winInfo.winner === 'X') {
        setTttWinner('user');
        setWinningLine(winInfo.combo);
        setTttScore((s) => ({ ...s, user: s.user + 1 }));
        const msg = isTamil
          ? 'அருமை! நீங்கள் வென்றுவிட்டீர்கள்! உங்கள் நகர்வு மிகச் சிறப்பானது! 🎉'
          : 'You won! Fantastic move! You completely outmaneuvered me! 🎉';
        setTttCommentary(msg);
        speak(msg);
      } else if (winInfo.winner === 'draw') {
        setTttWinner('draw');
        setTttScore((s) => ({ ...s, draws: s.draws + 1 }));
        const msg = isTamil ? 'சமநிலை!' : "It's a draw! Well played!";
        setTttCommentary(msg);
        speak(msg);
      }
    } else {
      setIsUserTurn(false);
    }
  };

  const resetTttGame = () => {
    setBoard(Array(9).fill(null));
    setTttWinner(null);
    setWinningLine(null);
    setIsUserTurn(true);
    setTttCommentary('');
  };

  // ═══════════════════════════════════════════════════════════════
  // GAME 2: ROCK-PAPER-SCISSORS VS BOT
  // ═══════════════════════════════════════════════════════════════
  const [rpsUserChoice, setRpsUserChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
  const [rpsAiChoice, setRpsAiChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
  const [rpsRoundResult, setRpsRoundResult] = useState<'win' | 'loss' | 'tie' | null>(null);
  const [rpsScore, setRpsScore] = useState({ user: 0, ai: 0, ties: 0 });
  const [rpsBanter, setRpsBanter] = useState<string>('');
  const [isRpsRolling, setIsRpsRolling] = useState(false);

  const playRps = (choice: 'rock' | 'paper' | 'scissors') => {
    if (isRpsRolling) return;
    setIsRpsRolling(true);
    setRpsUserChoice(choice);
    setRpsAiChoice(null);
    setRpsRoundResult(null);

    const options: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];

    setTimeout(() => {
      // Psychological AI move: fair random pick
      const aiPick = options[Math.floor(Math.random() * options.length)];
      setRpsAiChoice(aiPick);

      let result: 'win' | 'loss' | 'tie' = 'tie';
      let banter = '';

      if (choice === aiPick) {
        result = 'tie';
        setRpsScore((s) => ({ ...s, ties: s.ties + 1 }));
        banter = isTamil
          ? 'சமநிலை! நாம் இருவரும் ஒரே தேர்வை எடுத்தோம்!'
          : "It's a tie! Great minds think alike!";
      } else if (
        (choice === 'rock' && aiPick === 'scissors') ||
        (choice === 'paper' && aiPick === 'rock') ||
        (choice === 'scissors' && aiPick === 'paper')
      ) {
        result = 'win';
        setRpsScore((s) => ({ ...s, user: s.user + 1 }));
        banter = isTamil
          ? 'வெற்றி! உங்கள் தேர்வு என்னை வீழ்த்திவிட்டது! 🎉'
          : `You win this round! Your ${choice} beat my ${aiPick}! 🎉`;
      } else {
        result = 'loss';
        setRpsScore((s) => ({ ...s, ai: s.ai + 1 }));
        banter = isTamil
          ? `இந்த முறை எனது ${aiPick} வென்றுவிட்டது! அடுத்த முறை நீங்கள் வெல்லலாம்! 😉`
          : `Haha! My ${aiPick} got your ${choice} this round! Let's go again! 😉`;
      }

      setRpsRoundResult(result);
      setRpsBanter(banter);
      speak(banter);
      setIsRpsRolling(false);
    }, 500);
  };

  const resetRpsGame = () => {
    setRpsUserChoice(null);
    setRpsAiChoice(null);
    setRpsRoundResult(null);
    setRpsBanter('');
  };

  // ═══════════════════════════════════════════════════════════════
  // GAME 3: INTERACTIVE RIDDLE & BRAIN CHALLENGE
  // ═══════════════════════════════════════════════════════════════
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [riddleHintsShown, setRiddleHintsShown] = useState(0);
  const [riddleAnswerInput, setRiddleAnswerInput] = useState('');
  const [riddleFeedback, setRiddleFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [riddleStreak, setRiddleStreak] = useState(0);

  const currentRiddle = RIDDLES_DATA[riddleIndex % RIDDLES_DATA.length];

  const checkRiddleAnswer = (userGuess: string) => {
    if (!userGuess.trim() || riddleFeedback?.isCorrect) return;

    const cleanGuess = userGuess.trim().toLowerCase();
    const targetEn = currentRiddle.answerEn.toLowerCase();
    const targetTa = currentRiddle.answerTa.toLowerCase();

    const isMatch =
      cleanGuess.includes(targetEn) ||
      targetEn.includes(cleanGuess) ||
      cleanGuess.includes(targetTa) ||
      targetTa.includes(cleanGuess);

    if (isMatch) {
      setRiddleStreak((prev) => prev + 1);
      const winMsg = isTamil
        ? `அருமை! சரியான விடை: "${currentRiddle.answerTa}"! நீங்கள் மிகச் சிறந்த அறிவாளி! 🌟`
        : `Spot on! 🎉 The answer is "${currentRiddle.answerEn}"! Brilliant deduction!`;
      setRiddleFeedback({ isCorrect: true, text: winMsg });
      speak(winMsg);
    } else {
      const hintCount = riddleHintsShown < 2 ? riddleHintsShown + 1 : riddleHintsShown;
      setRiddleHintsShown(hintCount);
      const tryAgainMsg = isTamil
        ? `கிட்டத்தட்ட சரி, ஆனால் அதுவல்ல! குறிப்பு ${hintCount} பார்க்கவும்.`
        : `Creative guess, but not quite! Check Hint ${hintCount} above!`;
      setRiddleFeedback({ isCorrect: false, text: tryAgainMsg });
      speak(tryAgainMsg);
    }
  };

  const nextRiddle = () => {
    setRiddleIndex((prev) => prev + 1);
    setRiddleHintsShown(0);
    setRiddleAnswerInput('');
    setRiddleFeedback(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // GAME 4: MEMORY MATCH (CARD FLIPPING GAME)
  // ═══════════════════════════════════════════════════════════════
  const MEMORY_SYMBOLS = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸'];
  const [memoryDeck, setMemoryDeck] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState<number>(0);
  const [memoryWon, setMemoryWon] = useState<boolean>(false);

  const startMemoryGame = () => {
    const shuffled = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS].sort(() => Math.random() - 0.5);
    setMemoryDeck(shuffled);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMemoryMoves(0);
    setMemoryWon(false);
    setActiveGame('memory');
  };

  const handleFlipCard = (index: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedPairs.includes(index)) {
      return;
    }
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const [first, second] = newFlipped;
      if (memoryDeck[first] === memoryDeck[second]) {
        const newMatched = [...matchedPairs, first, second];
        setMatchedPairs(newMatched);
        setFlippedCards([]);
        if (newMatched.length === memoryDeck.length) {
          setMemoryWon(true);
          const winMsg = isTamil
            ? `அருமை! நீங்கள் ${memoryMoves + 1} நகர்வுகளில் அனைத்து ஜோடிகளையும் கண்டுபிடித்தீர்கள்! 🏆`
            : `Phenomenal! You cleared all memory pairs in ${memoryMoves + 1} moves! 🎉`;
          speak(winMsg);
        }
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 750);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // GAME 5: WORD GUESS QUEST
  // ═══════════════════════════════════════════════════════════════
  const [wordGuessIndex, setWordGuessIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wordGuessMistakes, setWordGuessMistakes] = useState(0);
  const [wordGuessWon, setWordGuessWon] = useState(false);
  const [wordGuessLost, setWordGuessLost] = useState(false);
  const [wordGuessInput, setWordGuessInput] = useState('');

  const currentWordItem = WORD_GUESS_DATA[wordGuessIndex % WORD_GUESS_DATA.length];
  const targetWord = currentWordItem.wordEn.toUpperCase();

  const handleGuessLetter = (letter: string) => {
    const l = letter.toUpperCase();
    if (guessedLetters.includes(l) || wordGuessWon || wordGuessLost) return;
    const nextGuessed = [...guessedLetters, l];
    setGuessedLetters(nextGuessed);

    if (!targetWord.includes(l)) {
      const nextMistakes = wordGuessMistakes + 1;
      setWordGuessMistakes(nextMistakes);
      if (nextMistakes >= 6) {
        setWordGuessLost(true);
        const loseMsg = isTamil
          ? `வாய்ப்புகள் முடிந்துவிட்டன! சரியான சொல்: "${currentWordItem.wordTa}" (${targetWord}).`
          : `Out of tries! The word was "${targetWord}". Try the next word!`;
        speak(loseMsg);
      }
    } else {
      const allFound = targetWord.split('').every((ch) => nextGuessed.includes(ch));
      if (allFound) {
        setWordGuessWon(true);
        const winMsg = isTamil
          ? `அருமை! நீங்கள் சொல்லைக் கண்டுபிடித்துவிட்டீர்கள்: "${currentWordItem.wordTa}"! 🎉`
          : `Fantastic! You correctly deduced "${targetWord}"! 🎉`;
        speak(winMsg);
      }
    }
  };

  const handleGuessFullWord = (word: string) => {
    if (!word.trim() || wordGuessWon || wordGuessLost) return;
    const cleaned = word.trim().toUpperCase();
    if (cleaned === targetWord) {
      setGuessedLetters(targetWord.split(''));
      setWordGuessWon(true);
      const winMsg = isTamil
        ? `அற்புதம்! நீங்கள் நேரடியாக சரியான சொல்லைக் கூறினீர்கள்: "${currentWordItem.wordTa}"! 🏆`
        : `Magnificent! You nailed the whole word: "${targetWord}"! 🏆`;
      speak(winMsg);
    } else {
      const nextMistakes = wordGuessMistakes + 1;
      setWordGuessMistakes(nextMistakes);
      if (nextMistakes >= 6) {
        setWordGuessLost(true);
        const loseMsg = isTamil
          ? `தவறான விடை! சரியான சொல்: "${currentWordItem.wordTa}" (${targetWord}).`
          : `Incorrect guess! The word was "${targetWord}".`;
        speak(loseMsg);
      }
    }
    setWordGuessInput('');
  };

  const resetWordGuess = () => {
    setGuessedLetters([]);
    setWordGuessMistakes(0);
    setWordGuessWon(false);
    setWordGuessLost(false);
    setWordGuessInput('');
  };

  const startWordGuessGame = () => {
    resetWordGuess();
    setActiveGame('wordguess');
  };

  const nextWordGuess = () => {
    setWordGuessIndex((prev) => prev + 1);
    resetWordGuess();
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        maxWidth: '780px',
        width: '100%',
        margin: '0 auto',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* ─── Top Game Header & Exit to Lobby ─── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CompanionMiniAvatar size={42} emotion={tttWinner === 'user' ? 'happy' : tttWinner === 'ai' ? 'excited' : userMood} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              🎮 {isTamil ? 'உண்மையான AI விளையாட்டுகள்' : 'Interactive Companion Games'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isTamil
                ? 'உங்கள் AI தோழனுடன் உண்மையான போட் விளையாட்டுகளை விளையாடுங்கள்!'
                : 'Play authentic games against your AI companion with real bot logic!'}
            </p>
          </div>
        </div>

        {activeGame !== 'lobby' && (
          <button
            onClick={() => setActiveGame('lobby')}
            className="btn-ghost"
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span>🏠</span>
            <span>{isTamil ? 'லாபிக்குத் திரும்பு' : 'Exit to Lobby'}</span>
          </button>
        )}
      </div>

      {/* ─── LOBBY VIEW (Matching Approved UI Reference) ─── */}
      {activeGame === 'lobby' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Stats Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(216, 208, 252, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4b5563' }}>
                Mood:
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(129, 140, 248, 0.15)',
                  color: '#4f46e5',
                  fontWeight: 700,
                  border: '1px solid rgba(129, 140, 248, 0.3)',
                }}
              >
                {userMood || 'Calm & Focused'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#4b5563' }}>
                <span>🎮</span>
                <span>Games Played: <strong>{tttScore.user + tttScore.ai + tttScore.draws + rpsScore.user + rpsScore.ai + rpsScore.ties + riddleStreak}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#4b5563' }}>
                <span>🔥</span>
                <span>Best Streak: <strong>{Math.max(rpsScore.user, riddleStreak, tttScore.user, 1)}</strong></span>
              </div>
            </div>
          </div>

          {/* Lobby Content: Cards Grid + Right Mascot Panel */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* 5 Attractive Game Cards Grid */}
            <div style={{ flex: '1 1 480px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              {/* Card 1: Tic-Tac-Toe */}
              <div
                className="glass-panel-elevated"
                style={{
                  padding: '14px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid rgba(129, 140, 248, 0.4)',
                  background: 'var(--bg-surface-elevated)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.08)',
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  {/* Attractive Glowing Neon Thumbnail */}
                  <div
                    style={{
                      height: '112px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.25,
                        backgroundImage: 'radial-gradient(#818cf8 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                      <span
                        style={{
                          fontSize: '2.4rem',
                          filter: 'drop-shadow(0 0 14px #38bdf8)',
                          color: '#38bdf8',
                          fontWeight: 900,
                          animation: 'subtleFloat 3s infinite ease-in-out',
                        }}
                      >
                        ✕
                      </span>
                      <span style={{ fontSize: '1.1rem', color: '#a5b4fc', fontWeight: 800 }}>VS</span>
                      <span
                        style={{
                          fontSize: '2.4rem',
                          filter: 'drop-shadow(0 0 14px #f43f5e)',
                          color: '#f43f5e',
                          fontWeight: 900,
                          animation: 'subtleFloat 3s infinite ease-in-out 1.5s',
                        }}
                      >
                        ◯
                      </span>
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(99, 102, 241, 0.45)',
                        color: '#c7d2fe',
                        border: '1px solid rgba(165, 180, 252, 0.4)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      🤖 MINIMAX AI
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Tic Tac Toe
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700, marginBottom: '6px' }}>
                    Strategy • 1 Player
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {isTamil
                      ? '3×3 கட்டத்தில் AI உடன் விளையாடுங்கள். வெல்ல முடியாத மினிமேக்ஸ் நிலை!'
                      : 'Beat AI in a classic challenge with Easy, Normal, and Unbeatable Minimax mode!'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetTttGame();
                    setActiveGame('tictactoe');
                  }}
                  className="btn-primary"
                  style={{
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  Play Now ▶
                </button>
              </div>

              {/* Card 2: Rock-Paper-Scissors */}
              <div
                className="glass-panel-elevated"
                style={{
                  padding: '14px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid rgba(251, 146, 60, 0.4)',
                  background: 'var(--bg-surface-elevated)',
                  boxShadow: '0 8px 24px rgba(234, 88, 12, 0.08)',
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  {/* Fiery Clash Arena Thumbnail */}
                  <div
                    style={{
                      height: '112px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #451a03 0%, #7c2d12 60%, #9a3412 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.2,
                        backgroundImage: 'radial-gradient(#fdba74 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                      <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px #fb923c)', animation: 'subtleFloat 2.6s infinite ease-in-out' }}>
                        ✊
                      </span>
                      <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 0 10px #fde047)', animation: 'subtleFloat 2.8s infinite ease-in-out 0.4s' }}>
                        ✋
                      </span>
                      <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px #f43f5e)', animation: 'subtleFloat 2.7s infinite ease-in-out 0.8s' }}>
                        ✌️
                      </span>
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(234, 88, 12, 0.45)',
                        color: '#fed7aa',
                        border: '1px solid rgba(251, 146, 60, 0.4)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      🔥 STREAK ARENA
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Rock Paper Scissors
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700, marginBottom: '6px' }}>
                    Action • Quick Play
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {isTamil
                      ? 'கல், காகிதம், கத்தரிக்கோல்! உடனடி முடிவுகள் மற்றும் வேடிக்கையான குரல் உரையாடல்கள்!'
                      : 'Show your skills! Fast-paced psychological contest with real bot banter.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetRpsGame();
                    setActiveGame('rps');
                  }}
                  className="btn-primary"
                  style={{
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                  }}
                >
                  Play Now ▶
                </button>
              </div>

              {/* Card 3: Memory Match */}
              <div
                className="glass-panel-elevated"
                style={{
                  padding: '14px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  background: 'var(--bg-surface-elevated)',
                  boxShadow: '0 8px 24px rgba(168, 85, 247, 0.08)',
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  {/* Holographic 3D Card Deck Thumbnail */}
                  <div
                    style={{
                      height: '112px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #2e1065 0%, #581c87 60%, #7e22ce 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.25,
                        backgroundImage: 'radial-gradient(#d8b4fe 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                      <div
                        style={{
                          width: '38px',
                          height: '52px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                          border: '1.5px solid #e9d5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          transform: 'rotate(-8deg)',
                          boxShadow: '0 6px 16px rgba(168,85,247,0.45)',
                        }}
                      >
                        ⭐
                      </div>
                      <div
                        style={{
                          width: '38px',
                          height: '52px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                          border: '1.5px solid #fbcfe8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          transform: 'rotate(8deg)',
                          boxShadow: '0 6px 16px rgba(236,72,153,0.45)',
                        }}
                      >
                        🃏
                      </div>
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(168, 85, 247, 0.45)',
                        color: '#f3e8ff',
                        border: '1px solid rgba(216, 180, 254, 0.4)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      ✨ 3D CARD FLIP
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Memory Match
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 700, marginBottom: '6px' }}>
                    Memory • Single Player
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {isTamil
                      ? 'பொருந்தும் அட்டைகளைத் திறந்து ஜோடிகளைக் கண்டறியுங்கள்!'
                      : 'Find matching friendly pairs! Test visual recall across 12 animated cards.'}
                  </p>
                </div>
                <button
                  onClick={startMemoryGame}
                  className="btn-primary"
                  style={{
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  Play Now ▶
                </button>
              </div>

              {/* Card 4: Riddle Challenge */}
              <div
                className="glass-panel-elevated"
                style={{
                  padding: '14px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: 'var(--bg-surface-elevated)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.08)',
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  {/* Ancient Mystery Puzzle & Lantern Thumbnail */}
                  <div
                    style={{
                      height: '112px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.2,
                        backgroundImage: 'radial-gradient(#6ee7b7 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
                      <span
                        style={{
                          fontSize: '2.5rem',
                          filter: 'drop-shadow(0 0 14px #34d399)',
                          animation: 'subtleFloat 3.2s infinite ease-in-out',
                        }}
                      >
                        💡
                      </span>
                      <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 8px #a7f3d0)' }}>🧩</span>
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.45)',
                        color: '#d1fae5',
                        border: '1px solid rgba(110, 231, 183, 0.4)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      🧠 BRAIN TEASER
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Riddle Challenge
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>
                    Brain Teaser • Single Player
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {isTamil
                      ? 'சுவாரஸ்யமான விடுகதைகள், அடுக்கு குறிப்புகள் மற்றும் உடனடி விடை சரிபார்த்தல்!'
                      : 'Think, guess and win! Smart bilingual riddles with progressive hints.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveGame('riddles')}
                  className="btn-primary"
                  style={{
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Play Now ▶
                </button>
              </div>

              {/* Card 5: Word Guess Quest */}
              <div
                className="glass-panel-elevated"
                style={{
                  padding: '14px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid rgba(217, 70, 239, 0.4)',
                  background: 'var(--bg-surface-elevated)',
                  boxShadow: '0 8px 24px rgba(217, 70, 239, 0.08)',
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  {/* Glowing 3D Letter Cubes Thumbnail */}
                  <div
                    style={{
                      height: '112px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #701a75 0%, #86198f 60%, #a21caf 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.2,
                        backgroundImage: 'radial-gradient(#f0abfc 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1 }}>
                      {['W', 'O', 'R', 'D'].map((char, i) => (
                        <div
                          key={i}
                          style={{
                            width: '28px',
                            height: '36px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '1rem',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
                          }}
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(192, 38, 211, 0.45)',
                        color: '#fae8ff',
                        border: '1px solid rgba(240, 171, 252, 0.4)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      📝 VOCAB QUEST
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Word Guess Quest
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#d946ef', fontWeight: 700, marginBottom: '6px' }}>
                    Vocabulary • Single Player
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {isTamil
                      ? 'மறைந்திருக்கும் சொல்லைக் கண்டுபிடியுங்கள்! சுவாரசியமான சொல் விளையாட்டு.'
                      : 'Uncover the secret companion words letter by letter with smart bilingual clues!'}
                  </p>
                </div>
                <button
                  onClick={startWordGuessGame}
                  className="btn-primary"
                  style={{
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #d946ef, #c026d3)',
                    boxShadow: '0 4px 14px rgba(217, 70, 239, 0.3)',
                  }}
                >
                  Play Now ▶
                </button>
              </div>
            </div>

            {/* Right Mascot & Earn Points Card */}
            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid rgba(216, 208, 252, 0.8)',
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(157, 141, 241, 0.1)',
                }}
              >
                <div
                  style={{
                    background: 'rgba(244, 240, 253, 0.9)',
                    border: '1px solid rgba(216, 208, 252, 0.8)',
                    borderRadius: '12px',
                    padding: '8px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#4f46e5',
                    marginBottom: '12px',
                  }}
                >
                  Ready to play? Choose a game and let's have some fun!
                </div>
                <CompanionMiniAvatar size={90} emotion="happy" state="idle" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 4. MEMORY MATCH VIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeGame === 'memory' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.86rem', fontWeight: 700, color: '#4b5563' }}>
              <span>Moves: <strong>{memoryMoves}</strong></span>
              <span>Matched: <strong>{matchedPairs.length / 2} / 6</strong></span>
            </div>
            <button
              onClick={startMemoryGame}
              className="btn-ghost"
              style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.82rem' }}
            >
              🔄 Restart
            </button>
          </div>

          {memoryWon && (
            <div
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid #10b981',
                color: '#065f46',
                fontWeight: 700,
                textAlign: 'center',
                fontSize: '0.92rem',
              }}
            >
              🎉 Congratulations! You found all matches in {memoryMoves} moves!
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            {memoryDeck.map((symbol, idx) => {
              const isFlipped = flippedCards.includes(idx) || matchedPairs.includes(idx);
              const isMatched = matchedPairs.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => handleFlipCard(idx)}
                  style={{
                    height: '84px',
                    perspective: '600px',
                    cursor: isFlipped ? 'default' : 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isFlipped ? '2.4rem' : '1.3rem',
                      background: isFlipped
                        ? isMatched
                          ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(16, 185, 129, 0.15))'
                          : 'var(--bg-surface-elevated)'
                        : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%)',
                      color: isFlipped ? '#1f2937' : '#ffffff',
                      border: isFlipped
                        ? isMatched
                          ? '2px solid #10b981'
                          : '2px solid #818cf8'
                        : '1.5px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: isFlipped
                        ? isMatched
                          ? '0 0 18px rgba(16, 185, 129, 0.45)'
                          : '0 4px 14px rgba(99, 102, 241, 0.15)'
                        : '0 6px 16px rgba(124, 58, 237, 0.35)',
                      transform: isFlipped ? 'rotateY(0deg) scale(1)' : 'rotateY(180deg) scale(0.96)',
                      transition: 'transform 320ms cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 250ms ease',
                    }}
                  >
                    {isFlipped ? (
                      <span style={{ animation: 'tttPop 0.3s ease-out' }}>{symbol}</span>
                    ) : (
                      <span style={{ fontSize: '1.2rem', opacity: 0.9 }}>✨</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. TIC-TAC-TOE VIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeGame === 'tictactoe' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Controls & Difficulty Header */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Difficulty Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isTamil ? 'சிரமம்:' : 'Bot Difficulty:'}
              </span>
              {(['easy', 'normal', 'unbeatable'] as TttDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setTttDifficulty(diff);
                    resetTttGame();
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    border: tttDifficulty === diff ? '1px solid var(--current-emotion-color)' : '1px solid var(--border-subtle)',
                    background: tttDifficulty === diff ? 'var(--current-emotion-soft)' : 'var(--bg-surface-elevated)',
                    color: tttDifficulty === diff ? 'var(--current-emotion-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {diff === 'easy' ? 'Easy' : diff === 'normal' ? 'Normal' : 'Unbeatable'}
                </button>
              ))}
            </div>

            {/* Scoreboard */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--pastel-lavender-accent)' }}>You (X): {tttScore.user}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: '#F87171' }}>AI Bot (O): {tttScore.ai}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--text-secondary)' }}>Draws: {tttScore.draws}</span>
            </div>
          </div>

          {/* Turn Indicator Banner */}
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '0.84rem',
              fontWeight: 700,
              background: tttWinner ? 'var(--bg-surface-elevated)' : isUserTurn ? 'var(--current-emotion-soft)' : 'rgba(239, 68, 68, 0.12)',
              color: tttWinner ? 'var(--text-primary)' : isUserTurn ? 'var(--current-emotion-color)' : '#EF4444',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tttWinner === 'user' ? (
              <span>🎉 You Won! Excellent strategy!</span>
            ) : tttWinner === 'ai' ? (
              <span>🤖 AI Bot Won! Nice try!</span>
            ) : tttWinner === 'draw' ? (
              <span>🤝 It's a Draw! Both defended well!</span>
            ) : isUserTurn ? (
              <span>Your Turn (X) — Pick an open square</span>
            ) : (
              <span>AI Bot is thinking (O)... ⏳</span>
            )}
          </div>

          {/* 3x3 Grid Board */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              width: '280px',
              height: '280px',
              margin: '8px 0',
              padding: '12px',
              borderRadius: '20px',
              background: 'var(--bg-canvas)',
              border: '2px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {board.map((cell, idx) => {
              const isWinningCell = winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={!isUserTurn || cell !== null || Boolean(tttWinner)}
                  style={{
                    borderRadius: '14px',
                    border: isWinningCell
                      ? '2px solid #38B57E'
                      : '1px solid var(--border-subtle)',
                    background: isWinningCell
                      ? 'rgba(56, 181, 126, 0.2)'
                      : cell
                      ? 'var(--bg-surface-elevated)'
                      : 'var(--bg-surface)',
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    cursor: !isUserTurn || cell !== null || Boolean(tttWinner) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cell === 'X' ? 'var(--pastel-lavender-accent)' : '#EF4444',
                    transition: 'all 150ms ease',
                    boxShadow: isWinningCell ? '0 0 16px rgba(56, 181, 126, 0.4)' : 'none',
                  }}
                >
                  {cell && (
                    <span
                      style={{
                        animation: 'tttPop 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        filter: cell === 'X' ? 'drop-shadow(0 0 10px #818cf8)' : 'drop-shadow(0 0 10px #f87171)',
                        display: 'inline-block',
                      }}
                    >
                      {cell}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bot Commentary */}
          {tttCommentary && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                fontStyle: 'italic',
                color: 'var(--text-primary)',
                textAlign: 'center',
                maxWidth: '420px',
              }}
            >
              💬 "{tttCommentary}"
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={resetTttGame}
              className="btn-primary"
              style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '0.84rem' }}
            >
              🔄 {isTamil ? 'மீண்டும் விளையாடு' : 'Restart Round'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. ROCK-PAPER-SCISSORS VIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeGame === 'rps' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {/* Score Counter */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: '12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ color: 'var(--pastel-lavender-accent)' }}>You: {rpsScore.user}</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: '#F87171' }}>AI Bot: {rpsScore.ai}</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>Ties: {rpsScore.ties}</span>
          </div>

          {/* Play Field Animation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px',
              padding: '24px',
              borderRadius: '20px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '440px',
            }}
          >
            {/* User Choice */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                You
              </div>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: 'var(--bg-surface-elevated)',
                  border: rpsRoundResult === 'win'
                    ? '2.5px solid #10b981'
                    : '2px solid var(--current-emotion-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.6rem',
                  boxShadow: rpsRoundResult === 'win'
                    ? '0 0 20px rgba(16, 185, 129, 0.5)'
                    : 'var(--shadow-sm)',
                  animation: isRpsRolling ? 'rpsThrow 0.45s ease-in-out infinite' : 'none',
                  transition: 'all 200ms ease',
                }}
              >
                {rpsUserChoice === 'rock' ? '✊' : rpsUserChoice === 'paper' ? '✋' : rpsUserChoice === 'scissors' ? '✌️' : '❓'}
              </div>
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-muted)' }}>VS</div>

            {/* AI Choice */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                AI Companion
              </div>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: 'var(--bg-surface-elevated)',
                  border: rpsRoundResult === 'loss'
                    ? '2.5px solid #ef4444'
                    : '2px solid #F87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.6rem',
                  boxShadow: rpsRoundResult === 'loss'
                    ? '0 0 20px rgba(239, 68, 68, 0.5)'
                    : 'var(--shadow-sm)',
                  animation: isRpsRolling ? 'rpsThrow 0.45s ease-in-out infinite' : 'none',
                  transition: 'all 200ms ease',
                }}
              >
                {isRpsRolling ? (
                  <span style={{ animation: 'spin 0.5s infinite linear' }}>🎲</span>
                ) : rpsAiChoice === 'rock' ? (
                  '✊'
                ) : rpsAiChoice === 'paper' ? (
                  '✋'
                ) : rpsAiChoice === 'scissors' ? (
                  '✌️'
                ) : (
                  '❓'
                )}
              </div>
            </div>
          </div>

          {/* Outcome Banner */}
          {rpsRoundResult && (
            <div
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '0.92rem',
                fontWeight: 700,
                background:
                  rpsRoundResult === 'win'
                    ? 'rgba(56, 181, 126, 0.16)'
                    : rpsRoundResult === 'loss'
                    ? 'rgba(239, 68, 68, 0.16)'
                    : 'rgba(157, 141, 241, 0.16)',
                color:
                  rpsRoundResult === 'win'
                    ? '#38B57E'
                    : rpsRoundResult === 'loss'
                    ? '#EF4444'
                    : 'var(--pastel-lavender-accent)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {rpsRoundResult === 'win' ? '🎉 You Won This Round!' : rpsRoundResult === 'loss' ? '🤖 AI Won This Round!' : '🤝 Round Tied!'}
            </div>
          )}

          {/* Banter Message */}
          {rpsBanter && (
            <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center' }}>
              💬 "{rpsBanter}"
            </div>
          )}

          {/* User Choice Buttons */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <button
              onClick={() => playRps('rock')}
              disabled={isRpsRolling}
              style={{
                padding: '14px 20px',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                fontSize: '1.8rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>✊</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Rock</span>
            </button>

            <button
              onClick={() => playRps('paper')}
              disabled={isRpsRolling}
              style={{
                padding: '14px 20px',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                fontSize: '1.8rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>✋</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Paper</span>
            </button>

            <button
              onClick={() => playRps('scissors')}
              disabled={isRpsRolling}
              style={{
                padding: '14px 20px',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                fontSize: '1.8rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>✌️</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scissors</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. INTERACTIVE RIDDLE CHALLENGE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeGame === 'riddles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header & Streak */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--current-emotion-color)' }}>
              Riddle #{riddleIndex + 1}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'var(--current-emotion-soft)',
                color: 'var(--current-emotion-color)',
              }}
            >
              🔥 Streak: {riddleStreak}
            </span>
          </div>

          {/* Riddle Card */}
          <div
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: 'var(--bg-surface-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {isTamil ? currentRiddle.questionTa : currentRiddle.questionEn}
            </div>
          </div>

          {/* Hints Section */}
          {riddleHintsShown > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(250, 159, 122, 0.14)',
                  border: '1px solid #FA9F7A',
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                }}
              >
                💡 <strong>Hint 1:</strong> {isTamil ? currentRiddle.hintsTa[0] : currentRiddle.hintsEn[0]}
              </div>
              {riddleHintsShown > 1 && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(157, 141, 241, 0.14)',
                    border: '1px solid #9D8DF1',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  🔍 <strong>Hint 2:</strong> {isTamil ? currentRiddle.hintsTa[1] : currentRiddle.hintsEn[1]}
                </div>
              )}
            </div>
          )}

          {/* Feedback banner */}
          {riddleFeedback && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: riddleFeedback.isCorrect ? 'rgba(56, 181, 126, 0.16)' : 'rgba(239, 68, 68, 0.14)',
                border: `1px solid ${riddleFeedback.isCorrect ? '#38B57E' : '#EF4444'}`,
                color: riddleFeedback.isCorrect ? '#38B57E' : '#EF4444',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              {riddleFeedback.text}
            </div>
          )}

          {/* Multiple Choice Options or Text Input */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {(isTamil ? currentRiddle.optionsTa : currentRiddle.optionsEn).map((opt, i) => (
              <button
                key={i}
                onClick={() => checkRiddleAnswer(opt)}
                disabled={Boolean(riddleFeedback?.isCorrect)}
                className="btn-ghost"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: riddleFeedback?.isCorrect ? 'default' : 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>

          {/* Text Guess Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={riddleAnswerInput}
              onChange={(e) => setRiddleAnswerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkRiddleAnswer(riddleAnswerInput)}
              disabled={Boolean(riddleFeedback?.isCorrect)}
              placeholder={isTamil ? 'அல்லது உங்கள் பதிலை தட்டச்சு செய்யவும்...' : 'Or type your answer...'}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
              }}
            />
            <button
              onClick={() => checkRiddleAnswer(riddleAnswerInput)}
              disabled={!riddleAnswerInput.trim() || Boolean(riddleFeedback?.isCorrect)}
              className="btn-primary"
              style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              {isTamil ? 'சரிபார்' : 'Check'}
            </button>
          </div>

          {/* Bottom Actions: Hint & Next */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            {riddleHintsShown < 2 && !riddleFeedback?.isCorrect ? (
              <button
                onClick={() => setRiddleHintsShown((prev) => prev + 1)}
                className="btn-ghost"
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              >
                💡 {isTamil ? 'குறிப்பு வேண்டும் (Need Hint)' : 'Need a hint?'}
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={nextRiddle}
              className="btn-primary"
              style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600 }}
            >
              {isTamil ? 'அடுத்த விடுகதை ➔' : 'Next Riddle ➔'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 5. WORD GUESS QUEST VIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeGame === 'wordguess' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Header & Category */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d946ef' }}>
              Word Quest #{wordGuessIndex + 1}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(217, 70, 239, 0.15)',
                color: '#d946ef',
                border: '1px solid rgba(217, 70, 239, 0.3)',
              }}
            >
              🏷️ {isTamil ? currentWordItem.categoryTa : currentWordItem.categoryEn}
            </span>
          </div>

          {/* Clue Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#d946ef', fontWeight: 700, marginBottom: '4px' }}>
              💡 {isTamil ? 'குறிப்பு (Clue):' : 'Bilingual Clue:'}
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {isTamil ? currentWordItem.clueTa : currentWordItem.clueEn}
            </div>
          </div>

          {/* Secret Word Tiles */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              margin: '12px 0',
            }}
          >
            {targetWord.split('').map((letter, idx) => {
              const isRevealed = guessedLetters.includes(letter) || wordGuessLost;
              return (
                <div
                  key={idx}
                  style={{
                    width: '46px',
                    height: '56px',
                    borderRadius: '12px',
                    border: isRevealed
                      ? wordGuessLost
                        ? '2px solid #ef4444'
                        : '2px solid #d946ef'
                      : '2px dashed var(--border-subtle)',
                    background: isRevealed
                      ? wordGuessLost
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(217, 70, 239, 0.15)'
                      : 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: isRevealed ? (wordGuessLost ? '#ef4444' : '#d946ef') : 'transparent',
                    boxShadow: isRevealed ? '0 0 14px rgba(217, 70, 239, 0.3)' : 'none',
                    animation: isRevealed ? 'tttPop 0.35s ease-out' : 'none',
                  }}
                >
                  {isRevealed ? letter : '_'}
                </div>
              );
            })}
          </div>

          {/* Mistakes Counter Hearts */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isTamil ? 'வாய்ப்புகள்:' : 'Tries Left:'}
            </span>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} style={{ fontSize: '1.2rem', opacity: i < 6 - wordGuessMistakes ? 1 : 0.25 }}>
                ❤️
              </span>
            ))}
          </div>

          {/* Victory / Defeat Banner */}
          {wordGuessWon && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.18)',
                border: '1px solid #10b981',
                color: '#065f46',
                fontWeight: 700,
                textAlign: 'center',
                animation: 'winCelebrate 1.8s infinite ease-in-out',
              }}
            >
              🎉 {isTamil ? `வாழ்த்துகள்! நீங்கள் "${currentWordItem.wordTa}" (${targetWord}) கண்டுபிடித்துவிட்டீர்கள்!` : `Brilliant! You solved "${targetWord}"!`}
            </div>
          )}

          {wordGuessLost && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#b91c1c',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              💔 {isTamil ? `வாய்ப்புகள் முடிந்துவிட்டன! சரியான சொல்: "${targetWord}".` : `Better luck next time! The word was "${targetWord}".`}
            </div>
          )}

          {/* Interactive Alphabet Keypad */}
          {!wordGuessWon && !wordGuessLost && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '6px',
                maxWidth: '520px',
                margin: '0 auto',
              }}
            >
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
                const isGuessed = guessedLetters.includes(char);
                const isHit = isGuessed && targetWord.includes(char);
                return (
                  <button
                    key={char}
                    onClick={() => handleGuessLetter(char)}
                    disabled={isGuessed}
                    style={{
                      width: '34px',
                      height: '38px',
                      borderRadius: '8px',
                      border: isGuessed
                        ? isHit
                          ? '1px solid #d946ef'
                          : '1px solid var(--border-subtle)'
                        : '1px solid var(--border-subtle)',
                      background: isGuessed
                        ? isHit
                          ? 'rgba(217, 70, 239, 0.25)'
                          : 'var(--bg-canvas)'
                        : 'var(--bg-surface-elevated)',
                      color: isGuessed
                        ? isHit
                          ? '#d946ef'
                          : 'var(--text-muted)'
                        : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: isGuessed ? 'default' : 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          )}

          {/* Full Word Guess Input */}
          {!wordGuessWon && !wordGuessLost && (
            <div style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto', width: '100%' }}>
              <input
                type="text"
                value={wordGuessInput}
                onChange={(e) => setWordGuessInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGuessFullWord(wordGuessInput)}
                placeholder={isTamil ? 'முழுச் சொல்லையும் யூகிக்கவும்...' : 'Guess whole word...'}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                }}
              />
              <button
                onClick={() => handleGuessFullWord(wordGuessInput)}
                disabled={!wordGuessInput.trim()}
                className="btn-primary"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #d946ef, #c026d3)',
                }}
              >
                Guess
              </button>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button
              onClick={resetWordGuess}
              className="btn-ghost"
              style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}
            >
              🔄 {isTamil ? 'மீண்டும் தொடங்கு' : 'Reset Word'}
            </button>
            <button
              onClick={nextWordGuess}
              className="btn-primary"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #d946ef, #a21caf)',
              }}
            >
              {isTamil ? 'அடுத்த சொல் ➔' : 'Next Word ➔'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
