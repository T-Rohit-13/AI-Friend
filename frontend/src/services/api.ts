/**
 * Typed API Client for AI Friend Backend
 * Interacts with FastAPI backend at http://localhost:8000/api/v1
 * Includes robust offline fallback so the UI remains 100% interactive under all conditions.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface SafetyNotice {
  is_crisis: boolean;
  crisis_helpline?: string;
  resources: string[];
  parent_alert_sent?: boolean;
  parent_contact_notified?: string | null;
  alert_status?: string | null;
}

export interface ChatTurnResponse {
  message_id: string;
  role: 'assistant';
  content: string;
  language: string;
  audio_url?: string | null;
  companion_emotion: string;
  user_emotion?: string;
  safety_notice?: SafetyNotice | null;
  navigation_intent?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  preferred_language: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  detected_emotion?: string;
  companion_emotion?: string;
  audio_url?: string | null;
  safety_notice?: SafetyNotice | null;
  created_at: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  fact: string;
  category: string;
  confidence: number;
  created_at: string;
}

export interface Riddle {
  id: string;
  question: string;
  hints: string[];
}

export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_index: number;
  fun_fact: string;
}

// Token management
let currentToken = localStorage.getItem('aifriend_token') || '';

export const setAuthToken = (token: string) => {
  currentToken = token;
  localStorage.setItem('aifriend_token', token);
};

export const getAuthToken = () => currentToken;

const headers = () => {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (currentToken) {
    h['Authorization'] = `Bearer ${currentToken}`;
  }
  return h;
};

export function extractErrorMessage(errData: any, defaultMsg: string): string {
  if (!errData) return defaultMsg;
  if (typeof errData.detail === 'string') return errData.detail;
  if (Array.isArray(errData.detail)) {
    return errData.detail
      .map((item: any) => {
        if (typeof item === 'string') return item;
        const loc = item.loc ? item.loc.filter((l: any) => l !== 'body').join(' ') : '';
        const msg = item.msg || item.message || JSON.stringify(item);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join('. ');
  }
  if (typeof errData.message === 'string') return errData.message;
  return defaultMsg;
}

// -------------------------------------------------------------
// Authentication & Core Services
// -------------------------------------------------------------
export const api = {
  async login(email: string, password: string): Promise<{ access_token: string; user: UserProfile; verification_required?: boolean; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(data, 'Incorrect email or password.'));
    }
    setAuthToken(data.access_token);
    return data;
  },

  async register(
    email: string,
    password: string,
    displayName: string,
    preferredLanguage = 'en',
    confirmPassword?: string,
    phoneNumber?: string,
    parentPhoneNumber?: string
  ): Promise<{ access_token: string; user: UserProfile; verification_required?: boolean; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        confirm_password: confirmPassword || password,
        display_name: displayName,
        preferred_language: preferredLanguage,
        phone_number: phoneNumber || undefined,
        parent_phone_number: parentPhoneNumber || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(data, 'Registration failed. Email may already be in use.'));
    }
    setAuthToken(data.access_token);
    return data;
  },

  async verifyOtp(email: string, otp: string): Promise<{ access_token: string; user: UserProfile; verification_required?: boolean; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(data, 'Invalid or expired verification code.'));
    }
    setAuthToken(data.access_token);
    return data;
  },

  async resendOtp(email: string): Promise<{ status: string; message: string; email: string; resend_cooldown_seconds: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(data, 'Failed to resend verification code.'));
    }
    return data;
  },

  async verifyEmail(token: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(data, 'Verification failed or link expired.'));
    }
    return data;
  },

  async resendVerification(email: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(data, 'Failed to resend verification email.'));
    }
    return data;
  },

  async getMe(): Promise<UserProfile | null> {
    try {
      if (!currentToken) return null;
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: headers(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  logout() {
    currentToken = '';
    localStorage.removeItem('aifriend_token');
  },

  async ensureAuthenticated(): Promise<string> {
    if (currentToken && currentToken !== 'mock_jwt_token_offline') {
      try {
        const verifyRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (verifyRes.ok) {
          return currentToken;
        }
      } catch (err) {
        console.warn('Token verification network issue:', err);
      }
      // If token expired or invalid, reset
      this.logout();
    }

    try {
      // Auto-register demo guest session with RFC-compliant public domain for Pydantic EmailStr
      const randId = Math.random().toString(36).substring(2, 9);
      const guestEmail = `guest_${randId}@aifriend.org`;
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: guestEmail,
          password: 'GuestPassword123!',
          display_name: 'Friend',
          preferred_language: 'en',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.access_token);
        return data.access_token;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Guest registration failed:', res.status, errJson);
      }
    } catch (e) {
      console.error('Backend connection error during authentication:', e);
    }
    return currentToken;
  },

  async inferAudioEmotion(audioBlob: Blob): Promise<{
    primary_emotion: string;
    confidence: number;
    distribution: Record<string, number>;
    acoustic_tone?: string;
    pitch_mean?: number;
    rms_energy?: number;
    uncertain?: boolean;
  }> {
    await this.ensureAuthenticated();
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.wav');
    const res = await fetch(`${API_BASE_URL}/api/v1/emotions/infer-audio`, {
      method: 'POST',
      headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Audio emotion inference failed (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async transcribeAudio(audioBlob: Blob, language = 'en'): Promise<{
    text: string;
    language: string;
    duration_seconds: number;
    detected_format?: string;
    provider?: string;
  }> {
    await this.ensureAuthenticated();
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('language', language);
    const res = await fetch(`${API_BASE_URL}/api/v1/voice/transcribe`, {
      method: 'POST',
      headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Speech transcription failed (HTTP ${res.status})`);
    }
    return await res.json();
  },

  getTtsAudioUrl(text: string, language = 'en', voice?: string): string {
    let url = `${API_BASE_URL}/api/v1/voice/tts?text=${encodeURIComponent(text)}&language=${encodeURIComponent(language)}`;
    if (voice) {
      url += `&voice=${encodeURIComponent(voice)}`;
    }
    return url;
  },

  getBaseUrl(): string {
    return API_BASE_URL;
  },

  // -------------------------------------------------------------
  // Chat & Conversation
  // -------------------------------------------------------------
  async createSession(title = 'New Conversation', language = 'en', persona = 'friendly_companion', mode = 'normal') {
    try {
      await this.ensureAuthenticated();
      let res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ title, language, persona, mode }),
      });

      // Handle token expiration
      if (res.status === 401) {
        this.logout();
        await this.ensureAuthenticated();
        res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ title, language, persona, mode }),
        });
      }

      if (res.ok) return await res.json();
      const errJson = await res.json().catch(() => ({}));
      console.error('Failed to create session on backend:', res.status, errJson);
    } catch (e) {
      console.error('Backend unavailable during createSession:', e);
    }
    return {
      id: `local-session-${Date.now()}`,
      title,
      language,
      persona,
      mode,
      created_at: new Date().toISOString(),
    };
  },

  async sendMessage(
    sessionId: string,
    content: string,
    language = 'en',
    detectedEmotion = 'neutral',
    mode = 'normal',
  ): Promise<ChatTurnResponse> {
    try {
      await this.ensureAuthenticated();

      // If session is local or missing, create a real backend session first
      let targetSessionId = sessionId;
      if (!targetSessionId || targetSessionId.startsWith('local-session-')) {
        const newSess = await this.createSession('AI Friend Session', language, 'friendly_companion', mode);
        if (newSess?.id && !newSess.id.startsWith('local-session-')) {
          targetSessionId = newSess.id;
        }
      }

      let res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${targetSessionId}/messages`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          content,
          mode: mode,
          detected_emotion: detectedEmotion,
        }),
      });

      // Handle 401 Unauthorized (expired token) with one retry
      if (res.status === 401) {
        this.logout();
        await this.ensureAuthenticated();
        // Also re-create session under new user
        const newSess = await this.createSession('AI Friend Session', language, 'friendly_companion', mode);
        targetSessionId = newSess.id;
        res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${targetSessionId}/messages`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            content,
            mode: mode,
            detected_emotion: detectedEmotion,
          }),
        });
      }

      if (res.ok) {
        const turnData = await res.json();
        return turnData;
      }

      const errData = await res.json().catch(() => null);
      const errorMsg = errData?.detail || `Backend returned error ${res.status}: ${res.statusText}`;
      console.error('Chat API error:', errorMsg);

      return {
        message_id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **AI Service Notice**: ${errorMsg}`,
        language,
        companion_emotion: 'warm',
      };
    } catch (e: any) {
      console.error('Network or backend exception during sendMessage:', e);
      return {
        message_id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Notice**: Unable to reach AI-Friend backend service (${e?.message || 'Network error'}). Please make sure the backend server is running at http://localhost:8000.`,
        language,
        companion_emotion: 'warm',
      };
    }
  },

  async getChatHistoryByMood(): Promise<Record<string, Array<{
    id: string;
    title: string;
    persona: string;
    language: string;
    mode: string;
    dominant_mood: string;
    message_count: number;
    last_message_preview?: string;
    updated_at: string;
    created_at: string;
  }>>> {
    try {
      await this.ensureAuthenticated();
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/history/by-mood`, {
        headers: headers(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch chat history by mood:', e);
    }
    return { happy: [], calm: [], sad: [], stressed: [], excited: [], neutral: [] };
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      await this.ensureAuthenticated();
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`, {
        headers: headers(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch session messages:', e);
    }
    return [];
  },

  // -------------------------------------------------------------
  // Games & Entertainment
  // -------------------------------------------------------------
  async getNextRiddle(): Promise<Riddle> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/games/riddles/next`, { headers: headers() });
      if (res.ok) return await res.json();
    } catch {}
    return {
      id: 'r1',
      question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
      hints: ['It repeats what you say.', 'Think about sound in a canyon.'],
    };
  },

  async checkRiddleAnswer(riddleId: string, answer: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/games/riddles/answer`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ riddle_id: riddleId, user_answer: answer }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const isCorrect = answer.toLowerCase().includes('echo');
    return {
      correct: isCorrect,
      message: isCorrect
        ? "Spot on! 🎉 The answer is indeed 'echo'. Superb intuition!"
        : "Creative guess, but not quite! Hint: It repeats your own voice back to you.",
    };
  },

  async getTrivia(): Promise<TriviaQuestion> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/games/trivia`, { headers: headers() });
      if (res.ok) return await res.json();
    } catch {}
    return {
      id: 't1',
      category: 'Science & Nature',
      question: 'What gives flamingos their vibrant pink hue?',
      options: ['Genetics', 'Carotenoids in algae and brine shrimp', 'Sunlight exposure', 'Mud baths'],
      correct_index: 1,
      fun_fact: 'Flamingo chicks are actually hatched with light grey down feathers!',
    };
  },

  // -------------------------------------------------------------
  // Study Buddy & Tutoring
  // -------------------------------------------------------------
  async explainConcept(topic: string, level = 'eli5') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/study/explain`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ topic, level }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return {
      topic,
      analogy: `Think of ${topic} like a neighborhood library: books are tiny energy packets passed smoothly between shelves. Each step has one clear, natural purpose.`,
      core_idea: `At its foundation, ${topic} is about balance, cause, and effect rather than confusing memorization.`,
      check_question: `How would you explain the first step of ${topic} to a friend?`,
    };
  },

  async generateQuiz(subject: string, num_questions = 3) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/study/quiz`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ subject, num_questions }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return {
      subject,
      cards: [
        {
          id: 1,
          question: `What is the core foundational principle behind ${subject}?`,
          key_takeaway: `Understanding how components interact under changing conditions is central to ${subject}.`,
        },
        {
          id: 2,
          question: `What is one common misconception people have about ${subject}?`,
          key_takeaway: 'People often assume it operates independently, but in practice it depends closely on environmental context.',
        },
        {
          id: 3,
          question: `How does ${subject} apply to everyday modern life?`,
          key_takeaway: 'It directly influences how modern digital and physical technologies optimize performance.',
        },
      ],
    };
  },

  // -------------------------------------------------------------
  // Transparent Memory Vault
  // -------------------------------------------------------------
  async getMemories(): Promise<UserMemory[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/memories`, { headers: headers() });
      if (res.ok) return await res.json();
    } catch {}
    const local = localStorage.getItem('aifriend_local_memories');
    return local ? JSON.parse(local) : [
      { id: 'm1', user_id: 'u1', fact: 'Prefers gentle, unhurried morning conversations', category: 'preference', confidence: 0.95, created_at: new Date().toISOString() },
      { id: 'm2', user_id: 'u1', fact: 'Currently learning React and Python', category: 'goal', confidence: 0.90, created_at: new Date().toISOString() },
    ];
  },

  async addMemory(fact: string, category = 'preference'): Promise<UserMemory> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/memories`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ fact, category }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const newMem: UserMemory = {
      id: `mem-${Date.now()}`,
      user_id: 'u1',
      fact,
      category,
      confidence: 1.0,
      created_at: new Date().toISOString(),
    };
    const list = await this.getMemories();
    localStorage.setItem('aifriend_local_memories', JSON.stringify([newMem, ...list]));
    return newMem;
  },

  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/memories/${memoryId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) return true;
    } catch {}
    const list = await this.getMemories();
    localStorage.setItem('aifriend_local_memories', JSON.stringify(list.filter(m => m.id !== memoryId)));
    return true;
  },

  async clearAllMemories(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/memories/clear`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) return true;
    } catch {}
    localStorage.removeItem('aifriend_local_memories');
    return true;
  },

  // -------------------------------------------------------------
  // Settings & Preferences
  // -------------------------------------------------------------
  async getPreferences(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settings/preferences`, {
        headers: headers(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch remote preferences:', err);
    }
    return null;
  },

  async updatePreferences(payload: Record<string, any>): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settings/preferences`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to save remote preferences:', err);
    }
    return null;
  },
};

