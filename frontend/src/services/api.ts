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
}

export interface ChatTurnResponse {
  message_id: string;
  role: 'assistant';
  content: string;
  language: string;
  audio_url?: string | null;
  companion_emotion: string;
  safety_notice?: SafetyNotice | null;
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

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
export const api = {
  async ensureAuthenticated() {
    if (currentToken) return currentToken;
    try {
      // Auto-register demo guest session if needed
      const guestEmail = `guest_${Math.random().toString(36).substring(2, 9)}@aifriend.local`;
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
      }
    } catch {
      // Offline fallback token
      const mockToken = 'mock_jwt_token_offline';
      setAuthToken(mockToken);
      return mockToken;
    }
    return '';
  },

  // -------------------------------------------------------------
  // Chat & Conversation
  // -------------------------------------------------------------
  async createSession(title = 'New Conversation', language = 'en', persona = 'friendly_companion') {
    try {
      await this.ensureAuthenticated();
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ title, language, persona }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using local session', e);
    }
    return {
      id: `local-session-${Date.now()}`,
      title,
      language,
      persona,
      created_at: new Date().toISOString(),
    };
  },

  async sendMessage(
    sessionId: string,
    content: string,
    language = 'en',
    detectedEmotion = 'neutral',
  ): Promise<ChatTurnResponse> {
    try {
      await this.ensureAuthenticated();
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          content,
          mode: 'chat',
          detected_emotion: detectedEmotion,
        }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using client empathy engine', e);
    }

    // Client-side empathetic fallback
    const lower = content.toLowerCase();
    
    // Safety check fallback
    if (lower.includes('kill myself') || lower.includes('suicide') || lower.includes('end my life')) {
      return {
        message_id: `msg-${Date.now()}`,
        role: 'assistant',
        content:
          "I am so sorry that you are feeling this heavy pain, but your life is deeply valuable. " +
          "As an AI companion, I cannot provide medical care. Please contact trained professionals right now: " +
          "Call or text 988 (US/Canada), 112 (Europe), or 9152987821 (India Tele-MANAS). Help is available 24/7.",
        language,
        companion_emotion: 'compassionate',
        safety_notice: {
          is_crisis: true,
          crisis_helpline: '988 (US/Canada) | 112 (EU) | 9152987821 (India Tele-MANAS)',
          resources: ['https://988lifeline.org', 'https://findahelpline.com'],
        },
      };
    }

    // Gentle conversational reply
    const replies: Record<string, string[]> = {
      en: [
        "I'm right here with you. Thank you for opening up. What's taking up the most space in your thoughts right now?",
        "That sounds like a lot to navigate. Remember to be gentle with yourself today. Would you like to talk more about it, or take a quick mental break with a game?",
        "It's so wonderful to hear that! What made it stand out the most for you?",
      ],
      es: [
        "Te escucho con atención y estoy aquí contigo. ¿Hay algo en lo que te pueda apoyar hoy?",
        "Gracias por compartirlo. Respira hondo, lo estás haciendo muy bien. ¿De qué te gustaría hablar?",
      ],
      hi: [
        "मैं हमेशा आपके साथ हूँ। आज का दिन आपके लिए कैसा रहा?",
        "यह जानकर अच्छा लगा! क्या आप इस बारे में और साझा करना चाहेंगे?",
      ],
    };

    const pool = replies[language] || replies.en;
    const contentReply = pool[Math.floor(Math.random() * pool.length)];

    return {
      message_id: `msg-${Date.now()}`,
      role: 'assistant',
      content: contentReply,
      language,
      companion_emotion: 'warm',
    };
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
};
