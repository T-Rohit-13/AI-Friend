import React, { useState, useEffect } from 'react';
import {
  getAvatarPreferences,
  saveAvatarPreferences,
  DEFAULT_AVATAR_PREFERENCES,
  type AvatarStyle,
  type CharacterGender,
} from '../../services/avatarPreferences';
import { EmotionalAvatar } from '../Avatar/EmotionalAvatar';
import { api } from '../../services/api';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isTamil = language === 'ta' || language.startsWith('ta');
  const [activeSection, setActiveSection] = useState<'ai' | 'appearance' | 'voice' | 'privacy'>('ai');
  const [activeSubTab, setActiveSubTab] = useState<'avatar' | 'voice' | 'behavior'>('avatar');

  // Working state
  const [prefs, setPrefs] = useState(() => getAvatarPreferences());
  const [nameInput, setNameInput] = useState(prefs.companionName || 'AI-Friend');
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(prefs.style);
  const [selectedGender, setSelectedGender] = useState<CharacterGender>(prefs.gender);
  const [autoMood, setAutoMood] = useState(prefs.autoMoodEnabled);
  const [gentleAck, setGentleAck] = useState(prefs.gentleAcknowledgements);
  const [moodOverride, setMoodOverride] = useState(prefs.avatarMoodOverride || 'auto');
  const [selectedVoice, setSelectedVoice] = useState(prefs.voiceId || '');
  const [emotionSharingOptIn, setEmotionSharingOptIn] = useState(prefs.emotionSharingOptIn !== false);
  const [privacyStrictMode, setPrivacyStrictMode] = useState(Boolean(prefs.privacyStrictMode));
  const [testEmotion, setTestEmotion] = useState<'happy' | 'calm' | 'excited' | 'sad' | 'frustrated'>('happy');

  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [previewSpeaking, setPreviewSpeaking] = useState(false);
  const [clearedHistoryNotice, setClearedHistoryNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getAvatarPreferences();
      setPrefs(current);
      setNameInput(current.companionName || 'AI-Friend');
      setSelectedStyle(current.style);
      setSelectedGender(current.gender);
      setAutoMood(current.autoMoodEnabled);
      setGentleAck(current.gentleAcknowledgements);
      setMoodOverride(current.avatarMoodOverride || 'auto');
      setSelectedVoice(current.voiceId || (current.gender === 'male' ? 'en-US-GuyNeural' : 'en-US-JennyNeural'));
      setEmotionSharingOptIn(current.emotionSharingOptIn !== false);
      setPrivacyStrictMode(Boolean(current.privacyStrictMode));
      setIsSavedNotice(false);
      setClearedHistoryNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = saveAvatarPreferences({
      style: 'emoji',
      companionName: nameInput.trim() || 'AI-Friend',
      autoMoodEnabled: autoMood,
      gentleAcknowledgements: gentleAck,
      avatarMoodOverride: moodOverride,
      voiceId: selectedVoice,
      emotionSharingOptIn,
      privacyStrictMode,
    });
    setPrefs(updated);

    // Sync with backend if user has an active token/session
    api.updatePreferences({
      companion_name: nameInput.trim() || 'AI-Friend',
      avatar_style: selectedStyle,
      avatar_gender: selectedGender,
      auto_expression_updates: autoMood,
      gentle_acknowledgements: gentleAck,
      avatar_mood_override: moodOverride,
      voice_id: selectedVoice,
      emotion_sharing_opt_in: emotionSharingOptIn,
      privacy_strict_mode: privacyStrictMode,
    }).catch(() => {});

    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setSelectedStyle(DEFAULT_AVATAR_PREFERENCES.style);
    setSelectedGender(DEFAULT_AVATAR_PREFERENCES.gender);
    setNameInput(DEFAULT_AVATAR_PREFERENCES.companionName);
    setAutoMood(DEFAULT_AVATAR_PREFERENCES.autoMoodEnabled);
    setGentleAck(DEFAULT_AVATAR_PREFERENCES.gentleAcknowledgements);
    setMoodOverride(DEFAULT_AVATAR_PREFERENCES.avatarMoodOverride || 'auto');
    setSelectedVoice(DEFAULT_AVATAR_PREFERENCES.gender === 'male' ? 'en-US-GuyNeural' : 'en-US-JennyNeural');
    setEmotionSharingOptIn(true);
    setPrivacyStrictMode(false);
  };

  const handlePlayVoicePreview = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = isTamil
        ? `வணக்கம்! நான் உங்கள் AI தோழன் ${nameInput || 'AI-Friend'}! நான் உங்களுக்கு உதவத் தயாராக உள்ளேன்.`
        : `Hello! I'm your AI companion, ${nameInput || 'AI-Friend'}! I'm here to listen, support, and chat with you anytime.`;
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = isTamil ? 'ta-IN' : 'en-US';
      utt.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      if (selectedVoice.includes('Guy') || selectedGender === 'male') {
        const maleVoice = voices.find(
          (v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('guy') ||
            v.name.toLowerCase().includes('valluvar')
        );
        if (maleVoice) utt.voice = maleVoice;
      } else {
        const femaleVoice = voices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('jenny') ||
            v.name.toLowerCase().includes('pallavi')
        );
        if (femaleVoice) utt.voice = femaleVoice;
      }

      utt.onstart = () => setPreviewSpeaking(true);
      utt.onend = () => setPreviewSpeaking(false);
      utt.onerror = () => setPreviewSpeaking(false);
      window.speechSynthesis.speak(utt);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(isTamil ? 'உரையாடல் வரலாற்றை அழிக்க விரும்புகிறீர்களா?' : 'Are you sure you want to clear your local session chat history?')) {
      localStorage.removeItem('aifriend_local_messages');
      localStorage.removeItem('aifriend_session_id');
      setClearedHistoryNotice(true);
      setTimeout(() => setClearedHistoryNotice(false), 2500);
    }
  };

  const effectivePreviewEmotion = moodOverride !== 'auto' ? (moodOverride as any) : testEmotion;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(20, 16, 36, 0.55)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 200ms ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Settings"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          background: 'var(--bg-canvas, #F8F6FC)',
          borderRadius: '24px',
          border: '1px solid rgba(216, 208, 252, 0.7)',
          boxShadow: '0 24px 60px rgba(79, 70, 229, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 28px',
            borderBottom: '1px solid rgba(216, 208, 252, 0.6)',
            background: 'var(--bg-surface-elevated, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary, #2D2847)' }}>
                {nameInput || 'AI-Friend'}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--current-emotion-color, #6366f1)' }}>
                  (Animated Emoji Companion)
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)' }}>
                {isTamil ? 'AI தோழன் அமைப்புகள் & தனிப்பயனாக்கம்' : 'Companion Personality, Expressive Avatar & Voice Settings'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-ai-settings-modal-btn"
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.3rem',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Main Body (Sidebar + Content) */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Left Sidebar Navigation */}
          <aside
            style={{
              width: '220px',
              borderRight: '1px solid rgba(216, 208, 252, 0.5)',
              padding: '20px 14px',
              background: 'rgba(244, 240, 253, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px', paddingLeft: '8px', letterSpacing: '0.5px' }}>
              {isTamil ? 'அமைப்புகள்' : 'Settings Categories'}
            </div>

            {[
              { id: 'ai' as const, label: isTamil ? 'AI தோழன்' : 'AI Companion', icon: '✨', subTab: 'avatar' as const },
              { id: 'appearance' as const, label: isTamil ? 'தோற்றம் & தீம்' : 'Appearance & Themes', icon: '🎨', subTab: 'avatar' as const },
              { id: 'voice' as const, label: isTamil ? 'குரல் & மொழி' : 'Voice & Language', icon: '🗣️', subTab: 'voice' as const },
              { id: 'privacy' as const, label: isTamil ? 'தனியுரிமை & தரவு' : 'Privacy & Behavior', icon: '🔒', subTab: 'behavior' as const },
            ].map((item) => {
              const active = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setActiveSubTab(item.subTab);
                  }}
                  id={`ai-settings-nav-${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.18))' : 'transparent',
                    color: active ? '#4f46e5' : '#4b5563',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                    boxShadow: active ? '0 2px 8px rgba(99, 102, 241, 0.12)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Clean, Lightweight Companion Info Card (Zero WebGL duplicate overhead!) */}
            <div
              style={{
                marginTop: 'auto',
                padding: '14px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid rgba(216, 208, 252, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>
                  {selectedStyle === 'emoji' ? '😊' : selectedGender === 'male' ? '🧑‍🦱' : '👩‍🦰'}
                </span>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1f2937' }}>
                    {nameInput || 'AI-Friend'}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#6366f1', fontWeight: 600 }}>
                    {selectedStyle === 'emoji' ? 'Animated Emoji' : selectedStyle === 'human' ? 'Stylized Human' : '3D Pixar Companion'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlayVoicePreview}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(216, 208, 252, 0.8)',
                  background: 'var(--current-emotion-soft, #EEF2FF)',
                  color: 'var(--current-emotion-color, #4F46E5)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>{previewSpeaking ? '⏹️' : '🔊'}</span>
                <span>{previewSpeaking ? (isTamil ? 'பேசுகிறது...' : 'Speaking...') : (isTamil ? 'குரல் சோதனை' : 'Test Voice')}</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content */}
          <main style={{ flex: 1, padding: '22px 28px', overflowY: 'auto' }}>
            {/* Sub-tabs Chips for rapid filtering */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'avatar' as const, label: isTamil ? 'அவதார் & தோற்றம்' : 'Avatar & Character', icon: '🔮' },
                  { id: 'voice' as const, label: isTamil ? 'குரல் & மொழி' : 'Voice & Language', icon: '🎧' },
                  { id: 'behavior' as const, label: isTamil ? 'நடத்தை & தனியுரிமை' : 'Behavior & Privacy', icon: '🧠' },
                ].map((tab) => {
                  const active = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveSubTab(tab.id);
                        if (tab.id === 'avatar') setActiveSection('ai');
                        else if (tab.id === 'voice') setActiveSection('voice');
                        else if (tab.id === 'behavior') setActiveSection('privacy');
                      }}
                      id={`ai-settings-subtab-${tab.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: active ? '1px solid #6366f1' : '1px solid rgba(216, 208, 252, 0.8)',
                        background: active ? '#6366f1' : '#ffffff',
                        color: active ? '#ffffff' : '#4b5563',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Reset shortcut */}
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {isTamil ? 'இயல்புநிலைக்கு மீட்டமை' : 'Reset to Defaults'}
              </button>
            </div>

            {/* ─── SECTION 1: AI COMPANION / AVATAR & CHARACTER ─── */}
            {(activeSection === 'ai' || activeSubTab === 'avatar') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
                  {/* Left Column: Avatar & Character */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Avatar Presentation Card */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                        {isTamil ? 'AI அவதார் பாணி' : 'AI Companion Avatar'}
                      </label>
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '16px',
                          border: '2px solid #6366f1',
                          background: 'rgba(99, 102, 241, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'var(--current-pastel-gradient, linear-gradient(135deg, #ede9fe, #dbeafe))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                          }}
                        >
                          😊
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1f2937' }}>
                            Animated Emoji Companion
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#6b7280', lineHeight: 1.4 }}>
                            Silky smooth vector avatar with eyelid blinking physics, speech mouth sync, and dynamic emotion reflection.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Companion Name Input */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#374151' }}>
                          {isTamil ? 'தோழனின் பெயர்' : 'Companion Name'}
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{nameInput.length}/20</span>
                      </div>
                      <input
                        type="text"
                        id="ai-name-input"
                        value={nameInput}
                        maxLength={20}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="AI-Friend"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Dynamic Personality & Expression Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Live Interactive Preview Box (Single, smooth WebGL/SVG instance) */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, rgba(205, 234, 252, 0.45), rgba(216, 208, 252, 0.45))',
                        border: '1px solid rgba(216, 208, 252, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div style={{ width: '92px', height: '92px', borderRadius: '50%', overflow: 'hidden', background: '#ffffff', flexShrink: 0, boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)' }}>
                        <EmotionalAvatar
                          emotion={effectivePreviewEmotion}
                          state={previewSpeaking ? 'speaking' : 'idle'}
                          size={92}
                          avatarStyle="emoji"
                          showControls={false}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          {isTamil ? 'நேரடி முன்னோட்டம்' : 'Real-time Preview'}
                        </div>
                        <div
                          style={{
                            background: '#ffffff',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: '#4f46e5',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          }}
                        >
                          {isTamil ? `வணக்கம்! நான் உங்கள் ${nameInput || 'தோழன்'}! ✨` : `Hello! I'm your ${nameInput || 'AI-Friend'}! ✨`}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          {(['happy', 'calm', 'excited', 'sad'] as const).map((emo) => (
                            <button
                              key={emo}
                              type="button"
                              onClick={() => setTestEmotion(emo)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                background: testEmotion === emo ? '#6366f1' : '#ffffff',
                                color: testEmotion === emo ? '#ffffff' : '#4b5563',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Auto Expression Updates */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#ffffff',
                        borderRadius: '14px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1f2937' }}>
                          {isTamil ? 'தானியங்கி முகபாவனை மாற்றம்' : 'Auto Expression Updates'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                          {isTamil ? 'உரையாடல் மனநிலைக்கு ஏற்ப அவதார் உணர்ச்சிகள் தானாக மாறும்.' : 'Companion dynamically synchronizes facial emotions with conversation tone.'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoMood}
                        onChange={(e) => setAutoMood(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Avatar Mood Override */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                        {isTamil ? 'அவதார் மனநிலை நிலைப்பாடு' : 'Fixed Avatar Mood Expression'}
                      </label>
                      <select
                        value={moodOverride}
                        onChange={(e) => setMoodOverride(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          outline: 'none',
                        }}
                      >
                        <option value="auto">{isTamil ? 'தானியங்கி (உரையாடல் உணர்வின் படி)' : 'Auto (Adaptive based on emotion sentiment)'}</option>
                        <option value="happy">Happy & Warm ☀️</option>
                        <option value="calm">Calm & Serene 🌿</option>
                        <option value="sad">Gentle & Supportive 💜</option>
                        <option value="frustrated">Concerned & Alert 🌸</option>
                        <option value="excited">Excited & Sparkling 🌟</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SECTION 2: APPEARANCE & THEMES ─── */}
            {activeSection === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#ffffff', padding: '18px', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                    {isTamil ? 'அவதார் உணர்வு மற்றும் பார்வை அமைப்பு' : 'Expressive Emotion Expressions'}
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5 }}>
                    {isTamil
                      ? 'உங்கள் AI தோழன் வெளிப்படுத்தும் உணர்வு முகபாவனைகள்.'
                      : 'Preview how your companion dynamically reflects feelings in real-time.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    {[
                      { emotion: 'happy', label: 'Joyful 😊', desc: 'Warm smile & sparkling cheeks' },
                      { emotion: 'calm', label: 'Calm 😌', desc: 'Gentle, soothing breath' },
                      { emotion: 'excited', label: 'Excited 🤩', desc: 'Starry, wide-eyed delight' },
                      { emotion: 'sad', label: 'Empathetic 🥺', desc: 'Gentle soft gaze, comforting presence' },
                    ].map((em) => (
                      <div
                        key={em.emotion}
                        onClick={() => setTestEmotion(em.emotion as any)}
                        style={{
                          padding: '14px 10px',
                          borderRadius: '14px',
                          border: testEmotion === em.emotion ? '2px solid #6366f1' : '1px solid #e5e7eb',
                          background: testEmotion === em.emotion ? 'rgba(99, 102, 241, 0.08)' : '#f9fafb',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '6px',
                        }}
                      >
                        <EmotionalAvatar emotion={em.emotion} state="idle" size={48} showControls={false} />
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1f2937' }}>{em.label}</div>
                        <div style={{ fontSize: '0.68rem', color: '#6b7280', lineHeight: 1.3 }}>{em.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── SECTION 3: VOICE & LANGUAGE ─── */}
            {(activeSection === 'voice' || activeSubTab === 'voice') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#ffffff', padding: '18px', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                    {isTamil ? 'குரல் மற்றும் உச்சரிப்பு விருப்பங்கள்' : 'Companion Voice Models & Speech'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Voice Model Select */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                        {isTamil ? 'குரல் மாதிரி (Voice Model)' : 'Selected Voice Engine'}
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '11px 14px',
                            borderRadius: '12px',
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            outline: 'none',
                          }}
                        >
                          <option value="en-US-JennyNeural">Natural Female Voice (English - Jenny)</option>
                          <option value="en-US-GuyNeural">Deep Warm Male Voice (English - Guy)</option>
                          <option value="ta-IN-PallaviNeural">தமிழ் பெண் குரல் (Tamil Female - Pallavi)</option>
                          <option value="ta-IN-ValluvarNeural">தமிழ் ஆண் குரல் (Tamil Male - Valluvar)</option>
                        </select>

                        <button
                          type="button"
                          onClick={handlePlayVoicePreview}
                          style={{
                            padding: '0 18px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                          }}
                          title="Listen to preview"
                        >
                          <span>{previewSpeaking ? '⏹️' : '▶️'}</span>
                          <span>{previewSpeaking ? (isTamil ? 'நிறுத்து' : 'Stop') : (isTamil ? 'கேளுங்கள்' : 'Preview')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Dump Mode Gentle Acknowledgements */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px',
                        background: '#f9fafb',
                        borderRadius: '14px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1f2937' }}>
                          {isTamil ? 'மென்மையான ஏற்புரைகள் (Dump Mode)' : 'Gentle Audio Acknowledgements'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                          {isTamil ? 'Dump Mode-ல் நீங்கள் பேசும்போது AI சுருக்கமான ஆதரவு ஒலிகளை வழங்கும் (எ.கா. "நான் கேட்கிறேன்").' : 'In Dump Mode, the companion softly responds with empathetic cues ("I am listening", "Take your time").'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={gentleAck}
                        onChange={(e) => setGentleAck(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SECTION 4: PRIVACY & BEHAVIOR ─── */}
            {(activeSection === 'privacy' || activeSubTab === 'behavior') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#ffffff', padding: '18px', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                    {isTamil ? 'தனியுரிமை மற்றும் உரையாடல் நடத்தை' : 'Privacy Protection & Emotional Boundaries'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Emotion Sharing Opt-in */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#f9fafb',
                        borderRadius: '14px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1f2937' }}>
                          {isTamil ? 'உணர்ச்சி வண்ண மாற்றம் அனுமதி' : 'Affective Tone Adaptation'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                          {isTamil ? 'உரையாடல் உணர்வின் அடிப்படையில் பயன்பாட்டு வண்ணங்களை மாற்ற அனுமதிக்கவும்.' : 'Allow companion to dynamically tune pastel background atmospheres to your mood.'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emotionSharingOptIn}
                        onChange={(e) => setEmotionSharingOptIn(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Strict Local Privacy Mode */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#f9fafb',
                        borderRadius: '14px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1f2937' }}>
                          {isTamil ? 'கடுமையான உள்ளூர் தனியுரிமை முறை' : 'Strict Local Privacy Mode'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                          {isTamil ? 'உரையாடல்களை சாதனத்தின் உள்ளூர் நினைவகத்தில் மட்டுமே சேமிக்கும்.' : 'Keep session messages strictly inside your browser local storage.'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyStrictMode}
                        onChange={(e) => setPrivacyStrictMode(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Clear Local History Button */}
                    <div style={{ paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '12px',
                          border: '1px solid #fca5a5',
                          background: '#fff1f2',
                          color: '#dc2626',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>🗑️</span>
                        <span>{isTamil ? 'உள்ளூர் அமர்வு வரலாற்றை அழிக்கவும்' : 'Clear Local Session History'}</span>
                      </button>

                      {clearedHistoryNotice && (
                        <div style={{ marginTop: '8px', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                          ✓ {isTamil ? 'உரையாடல் வரலாறு அழிக்கப்பட்டது!' : 'Local session chat history has been cleared!'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message Banner */}
            {isSavedNotice && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  background: 'rgba(52, 211, 153, 0.18)',
                  border: '1px solid #10b981',
                  color: '#065f46',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'fadeIn 180ms ease',
                }}
              >
                <span>✅</span>
                <span>{isTamil ? 'AI தோழன் அமைப்புகள் வெற்றிகரமாகப் பயன்படுத்தப்பட்டன!' : 'AI settings saved and applied successfully across companion views!'}</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(216, 208, 252, 0.6)',
                display: 'flex',
                justifyContent: 'flex-start',
                gap: '12px',
              }}
            >
              <button
                onClick={handleSave}
                id="save-ai-settings-btn"
                style={{
                  padding: '11px 26px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                  transition: 'transform 150ms ease',
                }}
              >
                {isTamil ? 'மாற்றங்களைச் சேமி' : 'Save Changes'}
              </button>

              <button
                onClick={handleReset}
                type="button"
                style={{
                  padding: '11px 18px',
                  borderRadius: '14px',
                  border: '1px solid #d1d5db',
                  background: 'transparent',
                  color: '#4b5563',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {isTamil ? 'இயல்புநிலை' : 'Reset to Default'}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
