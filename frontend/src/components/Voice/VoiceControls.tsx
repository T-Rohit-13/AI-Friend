import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { getThemeEngine } from '../../services/themeEngine';
import { AudioRecorder } from '../../services/audioRecorder';
import { EmotionalAvatar, type CompanionState } from '../Avatar/EmotionalAvatar';

interface VoiceControlsProps {
  onTranscript: (transcript: string, voiceEmotion?: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  language: string;
  isSpeaking: boolean;
  onInterruptSpeech: () => void;
  companionEmotion?: string;
  onEndCall?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onTranscript,
  isListening,
  setIsListening,
  language = 'en',
  isSpeaking,
  onInterruptSpeech,
  companionEmotion = 'neutral',
  onEndCall,
  isMuted = false,
  onToggleMute,
}) => {
  const [interimText, setInterimText] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);

  // Verification stage state
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [pendingTone, setPendingTone] = useState<string>('neutral');
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isTamil = language === 'ta' || language.startsWith('ta');
  const recognitionLang = isTamil ? 'ta-IN' : 'en-US';

  // Initialize Web Speech Recognition for live real-time feedback
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = recognitionLang;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          setInterimText(interim || final);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
          if (event.error === 'not-allowed') {
            setSpeechStatus(
              isTamil
                ? 'மைக்ரோஃபோன் அனுமதி தேவை (Mic permission needed)'
                : 'Microphone permission blocked. Please allow mic access.'
            );
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition init error:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [recognitionLang, isTamil]);

  // Start Audio Recording
  const startRecording = async () => {
    setSpeechStatus(null);
    setInterimText('');
    setPendingTranscript(null);
    setConfidenceScore(null);

    if (isSpeaking) {
      onInterruptSpeech();
    }

    // 1. Start Web Speech Recognition if available
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = recognitionLang;
        recognitionRef.current.start();
      } catch {}
    }

    // 2. Start AudioRecorder for clean 16kHz PCM WAV recording
    try {
      const recorder = new AudioRecorder();
      audioRecorderRef.current = recorder;
      await recorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.warn('Microphone access error:', err);
      setSpeechStatus(
        isTamil
          ? 'மைக்ரோஃபோன் அணுகலை அனுமதிக்கவும்'
          : `Microphone access error: ${err.message || 'Please check mic permissions.'}`
      );
      setIsListening(false);
    }
  };

  // Stop Recording & Process Transcript + Emotion
  const stopRecordingAndReview = async () => {
    setIsListening(false);
    setIsProcessingAudio(true);
    const capturedInterim = interimText;
    setInterimText('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (!audioRecorderRef.current) {
      setIsProcessingAudio(false);
      return;
    }

    try {
      const { blob } = await audioRecorderRef.current.stop();

      let detectedText = capturedInterim.trim();
      let vocalTone = 'neutral';
      let conf: number | null = null;

      // 1. Analyze genuine vocal emotion from real recorded audio
      try {
        const toneResult = await api.inferAudioEmotion(blob);
        if (toneResult && toneResult.primary_emotion) {
          vocalTone = toneResult.primary_emotion;
          conf = toneResult.confidence ? Math.round(toneResult.confidence * 100) : null;
          setConfidenceScore(conf);

          // Feed into ThemeEngine
          getThemeEngine().processInference({
            primary_emotion: toneResult.primary_emotion,
            confidence: toneResult.confidence ?? 0.7,
            distribution: toneResult.distribution ?? { [toneResult.primary_emotion]: 0.7 },
          });
        }
      } catch (e: any) {
        console.warn('Vocal emotion analysis notice:', e.message);
        getThemeEngine().reportModelUnavailable();
      }

      // 2. Transcribe via backend ASR if Web Speech was empty or unreliable
      if (!detectedText) {
        try {
          const asrResult = await api.transcribeAudio(blob, isTamil ? 'ta' : 'en');
          if (asrResult && asrResult.text) {
            detectedText = asrResult.text.trim();
          }
        } catch (e: any) {
          console.warn('Backend ASR error:', e.message);
          setSpeechStatus(e.message || 'Could not understand audio.');
        }
      }

      setIsProcessingAudio(false);

      if (detectedText) {
        // Present transcript to user for verification and correction
        setPendingTranscript(detectedText);
        setPendingTone(vocalTone);
      } else {
        setSpeechStatus(
          isTamil
            ? 'குரல் கேட்கவில்லை. மீண்டும் பேசவும்.'
            : 'No clear speech detected. Please speak closer to your microphone and try again.'
        );
      }
    } catch (err: any) {
      setIsProcessingAudio(false);
      setSpeechStatus(`Audio recording error: ${err.message}`);
    }
  };

  const handleConfirmSend = () => {
    if (!pendingTranscript || !pendingTranscript.trim()) return;
    onTranscript(pendingTranscript.trim(), pendingTone);
    setPendingTranscript(null);
    setSpeechStatus(null);
  };

  const handleCancelReview = () => {
    setPendingTranscript(null);
    setSpeechStatus(null);
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecordingAndReview();
    } else {
      startRecording();
    }
  };

  // Audio Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isListening) {
        phase += 0.08;
        const centerY = canvas.height / 2;
        ctx.beginPath();
        ctx.strokeStyle = isTamil ? '#9D8DF1' : '#78C6F1';
        ctx.lineWidth = 2.5;

        for (let x = 0; x < canvas.width; x++) {
          const y = centerY + Math.sin(x * 0.05 + phase) * 12 * Math.sin(x * 0.02);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isTamil]);

  const currentCompanionState: CompanionState = isSpeaking
    ? 'speaking'
    : isListening
    ? 'listening'
    : isProcessingAudio
    ? 'thinking'
    : 'idle';

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '24px 20px',
        borderRadius: '24px',
        maxWidth: '560px',
        margin: '0 auto',
        width: '100%',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* ─── Prominent Companion Avatar (Requirement Part 3 & Part 5) ─── */}
      <div style={{ position: 'relative', marginTop: '4px' }}>
        <EmotionalAvatar
          emotion={companionEmotion}
          state={currentCompanionState}
          size={140}
          showControls={false}
        />
        {/* State Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '3px 12px',
            borderRadius: '999px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: isListening ? '#E53E3E' : isSpeaking ? '#9D8DF1' : isProcessingAudio ? '#F59E0B' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isListening ? '#E53E3E' : isSpeaking ? '#9D8DF1' : isProcessingAudio ? '#F59E0B' : '#38B57E',
            }}
          />
          <span>
            {isListening
              ? (isTamil ? 'கேட்கிறது...' : 'Listening...')
              : isProcessingAudio
              ? (isTamil ? 'செயலாக்குகிறது...' : 'Processing audio...')
              : isSpeaking
              ? (isTamil ? 'பேசுகிறது...' : 'Speaking...')
              : (isTamil ? 'தயாராக உள்ளது' : 'Ready')}
          </span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={320}
        height={34}
        style={{
          width: '100%',
          maxWidth: '320px',
          height: '34px',
          opacity: isListening ? 1 : 0.25,
          transition: 'opacity 300ms ease',
          marginTop: '10px',
        }}
      />

      {/* Call Controls Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
        {/* Mute Button */}
        {onToggleMute && (
          <button
            type="button"
            onClick={onToggleMute}
            className="btn-ghost"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${isMuted ? '#EF4444' : 'var(--border-subtle)'}`,
              color: isMuted ? '#EF4444' : 'var(--text-primary)',
              cursor: 'pointer',
            }}
            title={isMuted ? 'Unmute companion speech' : 'Mute companion speech'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        )}

        {/* Main Microphone Record / Stop Button */}
        <button
          onClick={toggleListening}
          disabled={isProcessingAudio || Boolean(pendingTranscript)}
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: isListening
              ? '#E53E3E'
              : 'linear-gradient(135deg, var(--pastel-sky-accent, #78C6F1), var(--pastel-lavender-accent, #9D8DF1))',
            color: '#FFF',
            border: 'none',
            fontSize: '1.7rem',
            cursor: isProcessingAudio || Boolean(pendingTranscript) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isListening
              ? '0 0 28px rgba(229, 62, 62, 0.55)'
              : '0 8px 24px rgba(120, 198, 241, 0.4)',
            transform: isListening ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 250ms ease',
          }}
          title={isListening ? 'Click to finish speech' : 'Click to talk'}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
        >
          {isProcessingAudio ? '⏳' : isListening ? '⏹️' : '🎙️'}
        </button>

        {/* Stop Speaking / Interrupt Button (only when speaking) */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onInterruptSpeech}
            className="btn-ghost"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#EF4444',
              cursor: 'pointer',
            }}
            title="Interrupt AI speech"
            aria-label="Interrupt speech"
          >
            ⏸️
          </button>
        )}

        {/* End Call Button */}
        {onEndCall && (
          <button
            type="button"
            onClick={onEndCall}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#EF4444',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
            }}
            title={isTamil ? 'அழைப்பை முடிக்கவும்' : 'End Voice Call'}
            aria-label="End Voice Call"
          >
            📞
          </button>
        )}
      </div>

      {/* Status Label */}
      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary, #666)', textAlign: 'center' }}>
        {isListening
          ? (isTamil ? '🎙️ கேட்கிறது (Listening in Tamil)... Click ⏹️ when done' : '🎙️ Listening in English... Click ⏹️ when done')
          : isProcessingAudio
          ? (isTamil ? 'குரல் பகுப்பாய்வு செய்யப்படுகிறது...' : 'Analyzing speech & acoustic tone...')
          : (isTamil ? 'பேச மைக்ரோஃபோனைத் தட்டவும் (Tap mic to speak)' : 'Tap mic to speak with your companion')}
      </div>

      {/* Live Interim Transcript Bubble */}
      {isListening && interimText && (
        <div
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            background: 'var(--bg-surface-elevated, #FFF)',
            border: '1px solid var(--border-subtle, #DDD)',
            fontSize: '0.88rem',
            fontStyle: 'italic',
            color: 'var(--text-primary, #333)',
          }}
        >
          "{interimText}"
        </div>
      )}

      {/* Error Message */}
      {speechStatus && !pendingTranscript && (
        <div
          style={{
            fontSize: '0.82rem',
            color: '#C53030',
            background: '#FFF5F5',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid #FEB2B2',
            textAlign: 'center',
          }}
        >
          ⚠️ {speechStatus}
        </div>
      )}

      {/* Transcript Verification & Correction Stage (Requirement 2) */}
      {pendingTranscript !== null && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            borderRadius: '14px',
            background: 'var(--bg-surface-elevated, #FFFFFF)',
            border: '2px solid var(--primary, #78C6F1)',
            boxShadow: '0 8px 24px rgba(120, 198, 241, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary, #78C6F1)' }}>
              ✓ Verify Your Words Before Sending:
            </span>
            {confidenceScore !== null && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#EDF2F7',
                  color: '#4A5568',
                }}
              >
                Vocal Tone: <strong>{pendingTone}</strong> ({confidenceScore}%)
              </span>
            )}
          </div>

          <input
            type="text"
            value={pendingTranscript}
            onChange={(e) => setPendingTranscript(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '0.94rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #CCC)',
              background: 'var(--bg-surface, #FDFDFD)',
              color: 'var(--text-primary, #111)',
              boxSizing: 'border-box',
            }}
            aria-label="Editable recognized speech text"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={handleCancelReview}
              className="btn-ghost"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancel / Re-record
            </button>
            <button
              onClick={handleConfirmSend}
              style={{
                padding: '6px 18px',
                borderRadius: '8px',
                background: 'var(--primary, #78C6F1)',
                color: '#FFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(120, 198, 241, 0.4)',
              }}
            >
              Send to AI →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
