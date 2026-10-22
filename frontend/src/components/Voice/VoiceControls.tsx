import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { getThemeEngine } from '../../services/themeEngine';

interface VoiceControlsProps {
  onTranscript: (transcript: string, voiceEmotion?: string) => void;
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
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);
  const [detectedVoiceTone, setDetectedVoiceTone] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isTamil = language === 'ta' || language.startsWith('ta');

  // Normalize language for SpeechRecognition
  const recognitionLang = isTamil ? 'ta-IN' : 'en-US';

  // Initialize Web Speech Recognition
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
            stopRecordingAndSubmit(finalTranscript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
          if (event.error === 'not-allowed') {
            setSpeechStatus(isTamil ? 'மைக்ரோஃபோன் அனுமதி தேவை (Mic permission needed)' : 'Microphone permission blocked. Please allow mic access.');
          } else if (event.error === 'network') {
            setSpeechStatus(isTamil ? 'இணைப்பு பிழை - ஆடியோ பதிவு பயன்படுத்தப்படுகிறது' : 'Network issue with cloud ASR, switching to audio recording...');
          }
        };

        recognition.onend = () => {
          if (isListening) {
            // Auto restart if still supposed to listen
            try {
              recognition.start();
            } catch {}
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
  }, [recognitionLang, isListening, isTamil]);

  // Start Audio Stream & MediaRecorder
  const startRecording = async () => {
    setSpeechStatus(null);
    setInterimText('');
    setDetectedVoiceTone(null);
    audioChunksRef.current = [];

    // Stop companion speech
    if (isSpeaking) {
      onInterruptSpeech();
    }

    // 1. Start Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = recognitionLang;
        recognitionRef.current.start();
      } catch {}
    }

    // 2. Start MediaRecorder for acoustic tone analysis and backend ASR
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsListening(true);
    } catch (err: any) {
      console.warn('MediaRecorder mic access error:', err);
      setSpeechStatus(isTamil ? 'மைக்ரோஃபோன் அணுகலை அனுமதிக்கவும்' : 'Please allow microphone access to talk.');
      setIsListening(false);
    }
  };

  // Stop Recording and Process Voice Tone & Transcript
  const stopRecordingAndSubmit = async (recognizedText?: string) => {
    setIsListening(false);
    setIsProcessingAudio(true);
    setInterimText('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    // Short timeout to ensure all audio chunks are collected
    setTimeout(async () => {
      let finalSpeechText = recognizedText || '';
      let vocalTone = 'neutral';

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

        // 1. Analyze voice acoustic tone via real emotion model API
        // The result is fed into the ThemeEngine for smoothing/hysteresis
        try {
          const toneResult = await api.inferAudioEmotion(audioBlob);
          if (toneResult && toneResult.primary_emotion) {
            vocalTone = toneResult.primary_emotion;
            setDetectedVoiceTone(vocalTone);

            // Feed real inference into ThemeEngine (handles confidence
            // filtering, temporal smoothing, and hysteresis)
            const themeEngine = getThemeEngine();
            themeEngine.processInference({
              primary_emotion: toneResult.primary_emotion,
              confidence: toneResult.confidence ?? 0.7,
              distribution: toneResult.distribution ?? { [toneResult.primary_emotion]: 0.7 },
            });
          }
        } catch (e) {
          console.warn('Voice tone inference error:', e);
          // Report unavailability so theme engine retains current/default state
          getThemeEngine().reportModelUnavailable();
        }

        // 2. If browser speech didn't catch text, run backend transcribe
        if (!finalSpeechText.trim()) {
          try {
            finalSpeechText = await api.transcribeAudio(audioBlob, language);
          } catch (e) {
            console.warn('Backend ASR fallback error:', e);
          }
        }
      }

      setIsProcessingAudio(false);

      if (finalSpeechText.trim()) {
        onTranscript(finalSpeechText.trim(), vocalTone);
      } else {
        setSpeechStatus(isTamil ? 'குரல் கேட்கவில்லை. மீண்டும் பேசவும்.' : 'No clear speech detected. Please tap and speak again.');
      }
    }, 400);
  };

  // Toggle button click
  const toggleListening = () => {
    if (isListening) {
      stopRecordingAndSubmit();
    } else {
      startRecording();
    }
  };

  // Audio Waveform Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isListening || isSpeaking || isProcessingAudio) {
        step += 0.08;
        const width = canvas.width;
        const height = canvas.height;
        const mid = height / 2;

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isListening ? 'var(--color-primary-400)' : isProcessingAudio ? '#818cf8' : '#fbbf24';

        for (let x = 0; x < width; x += 3) {
          const freq = isListening ? 0.03 : 0.05;
          const amplitude = isListening ? 22 : 14;
          const y = mid + Math.sin(x * freq + step) * Math.sin(step * 0.5) * amplitude;
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
  }, [isListening, isSpeaking, isProcessingAudio]);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        borderRadius: '20px',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      {/* Waveform Visualizer */}
      <canvas
        ref={canvasRef}
        width={360}
        height={65}
        style={{
          width: '100%',
          maxWidth: '360px',
          height: '65px',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.25)',
        }}
      />

      {/* Voice Tone Feedback */}
      {detectedVoiceTone && (
        <div
          style={{
            fontSize: '0.82rem',
            padding: '4px 12px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--current-emotion-color)',
            color: 'var(--current-emotion-color)',
            fontWeight: 600,
          }}
        >
          🎙️ {isTamil ? 'கண்டறியப்பட்ட குரல் தொனி:' : 'Vocal Tone Detected:'} {detectedVoiceTone.toUpperCase()}
        </div>
      )}

      {/* Main Mic Button */}
      <button
        onClick={toggleListening}
        disabled={isProcessingAudio}
        style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          border: 'none',
          background: isListening
            ? 'linear-gradient(135deg, #ef4444, #f97316)'
            : 'linear-gradient(135deg, var(--color-primary-500), var(--color-amber-500))',
          color: '#ffffff',
          fontSize: '2rem',
          cursor: isProcessingAudio ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isListening ? '0 0 35px rgba(239, 68, 68, 0.6)' : '0 8px 24px rgba(20, 184, 166, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isListening ? 'scale(1.08)' : 'scale(1)',
        }}
        title={isListening ? 'Tap to Stop & Send' : 'Tap to Speak'}
      >
        {isListening ? '⏹️' : isProcessingAudio ? '⏳' : '🎙️'}
      </button>

      {/* Status Instruction */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {isProcessingAudio
            ? (isTamil ? 'குரல் தொனியை ஆய்வு செய்கிறது...' : 'Analyzing voice tone & transcribing...')
            : isListening
            ? (isTamil ? 'கேட்டுக்கொண்டிருக்கிறேன்... பேசி முடித்து நிறுத்த தட்டவும்' : 'Listening to your voice... Tap to finish & send')
            : (isTamil ? 'பேச மைக்ரோஃபோனை தட்டவும் (Speak in English or Tamil)' : 'Tap microphone to speak to your AI Friend')}
        </div>
        {interimText && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
            "{interimText}"
          </div>
        )}
        {speechStatus && (
          <div style={{ fontSize: '0.82rem', color: '#f87171', marginTop: '6px' }}>
            {speechStatus}
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        🌐 {isTamil ? 'தமிழ் & ஆங்கில குரல் தொனி ஆதரவு' : 'Supports natural human voice in English & Tamil'}
      </div>
    </div>
  );
};
