import React, { useState, useRef } from 'react';
import { AudioRecorder } from '../../services/audioRecorder';
import { api } from '../../services/api';
import { EmotionalAvatar, normalizeExpression } from '../Avatar/EmotionalAvatar';
import type { AvatarExpression } from '../Avatar/EmotionalAvatar';

export interface DevTestSample {
  id: string;
  timestamp: string;
  language: string;
  durationSeconds: number;
  byteSize: number;
  audioUrl: string;
  transcript: string | null;
  transcriptProvider: string | null;
  transcriptError: string | null;
  emotionPrediction: string | null;
  confidence: number | null;
  distribution: Record<string, number> | null;
  acousticTone: string | null;
  pitchMean: number | null;
  rmsEnergy: number | null;
  modelError: string | null;
  avatarExpression: AvatarExpression;
}

interface DevTestingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeLanguage: string;
  onApplyEmotionToAvatar?: (emotion: AvatarExpression) => void;
}

export const DevTestingPanel: React.FC<DevTestingPanelProps> = ({
  isOpen,
  onClose,
  activeLanguage = 'en',
  onApplyEmotionToAvatar,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>(activeLanguage.startsWith('ta') ? 'ta-IN' : 'en-US');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('idle');
  const [samples, setSamples] = useState<DevTestSample[]>([]);
  const [activeSample, setActiveSample] = useState<DevTestSample | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const startTestRecording = async () => {
    setGlobalError(null);
    setCurrentStage('recording');
    setRecordingSeconds(0);

    try {
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(Math.round((Date.now() - startTime) / 100) / 10);
      }, 100);
    } catch (err: any) {
      setIsRecording(false);
      setCurrentStage('error');
      setGlobalError(`Microphone access failed: ${err.message || err}`);
    }
  };

  const stopTestRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (!recorderRef.current) return;

    setCurrentStage('processing');

    let audioBlob: Blob;
    let durationSeconds = 0;
    try {
      const recordResult = await recorderRef.current.stop();
      audioBlob = recordResult.blob;
      durationSeconds = recordResult.durationSeconds;
    } catch (err: any) {
      setCurrentStage('error');
      setGlobalError(`Failed to process recorded audio: ${err.message}`);
      return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const sampleId = `sample-${Date.now()}`;

    // Initialize sample
    const newSample: DevTestSample = {
      id: sampleId,
      timestamp: new Date().toLocaleTimeString(),
      language: selectedLang,
      durationSeconds: Math.round(durationSeconds * 100) / 100,
      byteSize: audioBlob.size,
      audioUrl,
      transcript: null,
      transcriptProvider: null,
      transcriptError: null,
      emotionPrediction: null,
      confidence: null,
      distribution: null,
      acousticTone: null,
      pitchMean: null,
      rmsEnergy: null,
      modelError: null,
      avatarExpression: 'neutral',
    };

    // Run Speech Transcription & Voice Emotion Analysis in parallel
    const langCode = selectedLang.startsWith('ta') ? 'ta' : 'en';

    // 1. ASR Execution
    const asrPromise = api.transcribeAudio(audioBlob, langCode)
      .then((res) => {
        newSample.transcript = res.text;
        newSample.transcriptProvider = res.provider || 'backend_asr';
      })
      .catch((err: any) => {
        newSample.transcriptError = err.message || 'Speech recognition failed';
      });

    // 2. Emotion Model Inference Execution
    const emotionPromise = api.inferAudioEmotion(audioBlob)
      .then((res) => {
        newSample.emotionPrediction = res.primary_emotion;
        newSample.confidence = Math.round(res.confidence * 100) / 100;
        newSample.distribution = res.distribution;
        newSample.acousticTone = res.acoustic_tone || null;
        newSample.pitchMean = res.pitch_mean || null;
        newSample.rmsEnergy = res.rms_energy || null;
        newSample.avatarExpression = normalizeExpression(res.primary_emotion);

        if (onApplyEmotionToAvatar) {
          onApplyEmotionToAvatar(newSample.avatarExpression);
        }
      })
      .catch((err: any) => {
        newSample.modelError = err.message || 'Voice emotion inference failed';
        newSample.avatarExpression = 'neutral';
      });

    await Promise.allSettled([asrPromise, emotionPromise]);

    setCurrentStage('complete');
    setActiveSample(newSample);
    setSamples((prev) => [newSample, ...prev]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 12, 27, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-panel-title"
    >
      <div
        style={{
          background: 'var(--bg-surface-elevated, #FFFFFF)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
          overflow: 'hidden',
          color: 'var(--text-primary, #1A1A24)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, #F8F9FD)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔬</span>
            <div>
              <h2 id="dev-panel-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Developer Testing & Diagnostics Panel
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #666)' }}>
                Inspect real microphone recording, ASR transcripts, neural emotion inference, and avatar reactions.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              padding: '6px 14px',
              fontSize: '1rem',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            aria-label="Close diagnostic panel"
          >
            ✕ Close
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'var(--bg-surface, #F4F6FC)',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Test Language:
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  disabled={isRecording}
                  style={{
                    marginLeft: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle, #CCC)',
                    background: '#FFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="en-US">English (en-US)</option>
                  <option value="ta-IN">Tamil (ta-IN / தமிழ்)</option>
                </select>
              </label>

              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'var(--border-subtle, #E2E8F0)',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                Stage: {currentStage}
              </span>

              {isRecording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E53E3E', fontWeight: 700 }}>
                  <span className="animate-antenna-pulse">🔴</span>
                  <span>Recording: {recordingSeconds}s</span>
                </div>
              )}
            </div>

            <div>
              {!isRecording ? (
                <button
                  onClick={startTestRecording}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #78C6F1, #9D8DF1)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(120, 198, 241, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🎙️</span> Record Test Sample
                </button>
              ) : (
                <button
                  onClick={stopTestRecording}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '999px',
                    background: '#E53E3E',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(229, 62, 62, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⏹️</span> Stop & Inspect Audio
                </button>
              )}
            </div>
          </div>

          {/* Global Error Banner */}
          {globalError && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: '#FFF5F5',
                border: '1px solid #FEB2B2',
                color: '#C53030',
                fontSize: '0.88rem',
              }}
            >
              ⚠️ {globalError}
            </div>
          )}

          {/* Active Sample Inspector */}
          {activeSample ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Card 1: Audio Signal & Microphone Details */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface, #F8FAFD)',
                  border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>1. Audio Capture</h3>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: '#E6FFFA',
                      color: '#234E52',
                      fontWeight: 700,
                    }}
                  >
                    16kHz Mono WAV
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <strong>Duration:</strong> {activeSample.durationSeconds}s
                  </div>
                  <div>
                    <strong>Payload Size:</strong> {(activeSample.byteSize / 1024).toFixed(1)} KB ({activeSample.byteSize} bytes)
                  </div>
                  <div>
                    <strong>Language:</strong> {activeSample.language}
                  </div>
                </div>

                {/* Audio playback player */}
                <div style={{ marginTop: 'auto' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Playback Recorded Audio:
                  </label>
                  <audio controls src={activeSample.audioUrl} style={{ width: '100%', height: '36px' }} />
                </div>
              </div>

              {/* Card 2: Speech Recognition Output */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface, #F8FAFD)',
                  border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>2. Speech Recognition (ASR)</h3>
                  {activeSample.transcriptProvider && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: '#EBF8FF',
                        color: '#2B6CB0',
                        fontWeight: 700,
                      }}
                    >
                      {activeSample.transcriptProvider}
                    </span>
                  )}
                </div>

                {activeSample.transcript ? (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: '#FFF',
                      border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      minHeight: '60px',
                      wordBreak: 'break-word',
                    }}
                  >
                    "{activeSample.transcript}"
                  </div>
                ) : activeSample.transcriptError ? (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: '#FFF5F5',
                      border: '1px solid #FEB2B2',
                      color: '#C53030',
                      fontSize: '0.82rem',
                    }}
                  >
                    ❌ {activeSample.transcriptError}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#999' }}>Awaiting speech recognition...</div>
                )}
              </div>

              {/* Card 3: Neural Voice Emotion Analysis */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface, #F8FAFD)',
                  border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>3. Voice Emotion CNN</h3>
                  {activeSample.confidence !== null && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: activeSample.confidence > 0.6 ? '#F0FFF4' : '#FFFFF0',
                        color: activeSample.confidence > 0.6 ? '#22543D' : '#744210',
                        fontWeight: 700,
                      }}
                    >
                      Confidence: {(activeSample.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {activeSample.emotionPrediction ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {activeSample.emotionPrediction === 'happy' ? '😊' :
                         activeSample.emotionPrediction === 'sad' ? '🥺' :
                         activeSample.emotionPrediction === 'calm' ? '😌' :
                         activeSample.emotionPrediction === 'excited' ? '🤩' :
                         activeSample.emotionPrediction === 'frustrated' ? '😤' :
                         activeSample.emotionPrediction === 'confused' ? '🤨' : '😐'}
                      </span>
                      <div>
                        <strong>Primary Emotion:</strong>{' '}
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                          {activeSample.emotionPrediction}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #666)' }}>
                      <strong>Acoustic Tone:</strong> {activeSample.acousticTone || 'neutral'} •{' '}
                      <strong>Pitch:</strong> {activeSample.pitchMean ? `${activeSample.pitchMean} Hz` : 'N/A'} •{' '}
                      <strong>RMS Energy:</strong> {activeSample.rmsEnergy !== null ? activeSample.rmsEnergy : 'N/A'}
                    </div>

                    {/* Probability Distribution Bars */}
                    {activeSample.distribution && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {Object.entries(activeSample.distribution).map(([emo, prob]) => (
                          <div key={emo} style={{ fontSize: '0.74rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ textTransform: 'capitalize' }}>{emo}</span>
                              <span>{(prob * 100).toFixed(1)}%</span>
                            </div>
                            <div
                              style={{
                                height: '5px',
                                borderRadius: '999px',
                                background: '#E2E8F0',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, prob * 100)}%`,
                                  height: '100%',
                                  background: emo === activeSample.emotionPrediction ? 'var(--primary, #78C6F1)' : '#A0AEC0',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : activeSample.modelError ? (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: '#FFF5F5',
                      border: '1px solid #FEB2B2',
                      color: '#C53030',
                      fontSize: '0.82rem',
                    }}
                  >
                    ❌ {activeSample.modelError}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#999' }}>Awaiting neural inference...</div>
                )}
              </div>

              {/* Card 4: Animated Avatar Reaction Preview */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface, #F8FAFD)',
                  border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, alignSelf: 'flex-start' }}>
                  4. Avatar Face Reaction
                </h3>
                <EmotionalAvatar
                  emotion={activeSample.avatarExpression}
                  state="idle"
                  size={105}
                  personaName="Test Face"
                />
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #666)' }}>
                  Rendered Expression: <span style={{ textTransform: 'capitalize' }}>{activeSample.avatarExpression}</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '36px',
                textAlign: 'center',
                borderRadius: '16px',
                border: '2px dashed var(--border-subtle, #DDD)',
                color: 'var(--text-secondary, #777)',
                fontSize: '0.92rem',
              }}
            >
              🎙️ No sample recorded yet. Click "Record Test Sample", speak into your microphone in English or Tamil, and inspect the real output across each pipeline stage.
            </div>
          )}

          {/* Test Samples History Table */}
          {samples.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
                Recorded Test Samples History ({samples.length})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle, #EEE)', color: '#666' }}>
                      <th style={{ padding: '8px' }}>Time</th>
                      <th style={{ padding: '8px' }}>Lang</th>
                      <th style={{ padding: '8px' }}>Duration</th>
                      <th style={{ padding: '8px' }}>Transcript</th>
                      <th style={{ padding: '8px' }}>Vocal Emotion</th>
                      <th style={{ padding: '8px' }}>Confidence</th>
                      <th style={{ padding: '8px' }}>Avatar Expression</th>
                      <th style={{ padding: '8px' }}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map((s) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle, #F0F0F0)',
                          background: activeSample?.id === s.id ? 'rgba(120, 198, 241, 0.12)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '8px' }}>{s.timestamp}</td>
                        <td style={{ padding: '8px' }}>{s.language}</td>
                        <td style={{ padding: '8px' }}>{s.durationSeconds}s</td>
                        <td style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.transcript || (s.transcriptError ? <span style={{ color: 'red' }}>Error</span> : 'None')}
                        </td>
                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>
                          {s.emotionPrediction || 'N/A'}
                        </td>
                        <td style={{ padding: '8px' }}>
                          {s.confidence !== null ? `${(s.confidence * 100).toFixed(0)}%` : 'N/A'}
                        </td>
                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>
                          {s.avatarExpression}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <button
                            onClick={() => setActiveSample(s)}
                            className="btn-ghost"
                            style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
