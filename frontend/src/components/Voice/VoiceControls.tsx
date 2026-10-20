import React, { useState, useEffect, useRef } from 'react';

interface VoiceControlsProps {
  onTranscript: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  language: string;
  isSpeaking: boolean;
  onInterruptSpeech: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onTranscript,
  isListening,
  setIsListening,
  language = 'en',
  isSpeaking,
  onInterruptSpeech,
}) => {
  const [interimText, setInterimText] = useState('');
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimText(interim);

      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
        setInterimText('');
        if (!isHandsFree) {
          recognition.stop();
          setIsListening(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isHandsFree && isListening) {
        try {
          recognition.start();
        } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [language, isHandsFree, isListening]);

  // Handle start / stop
  const toggleListening = () => {
    // If companion is speaking and user taps mic, trigger barge-in interrupt
    if (isSpeaking) {
      onInterruptSpeech();
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setInterimText('');
    } else {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  // Canvas Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isListening || isSpeaking) {
        step += 0.08;
        const width = canvas.width;
        const height = canvas.height;
        const mid = height / 2;

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isListening ? '#2dd4bf' : '#fbbf24';

        for (let x = 0; x < width; x += 3) {
          const freq = isListening ? 0.03 : 0.04;
          const amp = (isListening ? 14 : 18) * Math.sin((x / width) * Math.PI);
          const y = mid + Math.sin(x * freq + step) * amp * Math.cos(step * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening, isSpeaking]);

  return (
    <div
      className="glass-panel-elevated"
      style={{
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '560px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Live Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={340}
        height={48}
        style={{
          width: '100%',
          maxWidth: '340px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Interim Live Transcript */}
      {interimText && (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-primary-400)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          "{interimText}..."
        </div>
      )}

      {/* Primary Microphone Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleListening}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: isListening
              ? 'radial-gradient(circle, #ef4444 0%, #dc2626 100%)'
              : 'radial-gradient(circle, var(--color-primary-400) 0%, var(--color-primary-600) 100%)',
            color: '#ffffff',
            fontSize: '1.6rem',
            cursor: 'pointer',
            boxShadow: isListening
              ? '0 0 25px rgba(239, 68, 68, 0.6)'
              : '0 0 25px rgba(20, 184, 166, 0.4)',
            transition: 'all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isListening ? 'scale(1.08)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isListening ? 'Click to stop listening' : 'Click to speak'}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>

        {/* Hands-Free Toggle */}
        <button
          onClick={() => setIsHandsFree(!isHandsFree)}
          className="btn-ghost"
          style={{
            fontSize: '0.8rem',
            padding: '6px 12px',
            border: isHandsFree ? '1px solid var(--color-primary-400)' : '1px solid var(--border-subtle)',
            background: isHandsFree ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
            color: isHandsFree ? 'var(--color-primary-400)' : 'var(--text-secondary)',
          }}
          title="Keep microphone active continuously for conversational flow"
        >
          {isHandsFree ? '🔄 Hands-Free ON' : '👆 Push-to-Talk'}
        </button>
      </div>

      {!hasSpeechSupport && (
        <div style={{ fontSize: '0.75rem', color: '#f87171' }}>
          ⚠️ Browser speech recognition not supported. You can still type in the chat box!
        </div>
      )}
    </div>
  );
};
