import os
import random
import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, AsyncGenerator
import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """Abstract interface for LLM companion providers."""

    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> str:
        """Generate a complete companion text response."""
        pass

    @abstractmethod
    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> AsyncGenerator[str, None]:
        """Stream token chunks for real-time typing effect."""
        pass


class MockLLMClient(BaseLLMProvider):
    """Zero-external-dependency local companion engine with rich multi-lingual & emotional capabilities."""

    EMPATHETIC_RESPONSES = {
        "en": [
            "I hear how demanding that must have been. Take a slow breath—you made it through today. What's one gentle thing you can do for yourself tonight?",
            "Thank you for sharing that with me. It takes real courage to acknowledge when things feel heavy. I'm right here with you—would it help to talk through it, or would you rather distract yourself with a light quiz?",
            "That sounds like a wonderful moment! It brings me so much joy to hear things looking up. Tell me more about what made it special?",
            "It is completely valid to feel exhausted after navigating all of that. Give yourself some grace. Want to unwind with a quick riddle, or just chat casually?",
            "I'm listening closely. Sometimes just putting feelings into words is the first step toward lightness. Take all the time you need.",
        ],
        "es": [
            "Te escucho con atención y entiendo lo agotador que puede ser. Respira con calma; lograste superar el día. ¿Hay algo agradable que puedas hacer por ti esta noche?",
            "Gracias por compartir esto conmigo. Es totalmente comprensible sentirse abrumado a veces. Estoy aquí contigo: ¿prefieres desahogarte o te gustaría relajarte con una adivinanza?",
            "¡Qué alegría me da escuchar eso! Cuéntame más sobre lo que hizo que fuera un momento tan especial.",
        ],
        "hi": [
            "मैं आपकी बात समझ सकता हूँ, आज का दिन सचमुच बहुत थका देने वाला रहा होगा। गहरी साँस लें—आप बहुत अच्छा कर रहे हैं। क्या आप इस बारे में और बात करना चाहते हैं?",
            "यह सुनकर बहुत अच्छा लगा! मुझे आपकी खुशी में शामिल होकर बेहद आनंद हो रहा है। इसके बारे में मुझे और बताइए?",
            "मैं हमेशा आपके साथ हूँ। जब भी मन भारी लगे, आप बेझिझक मुझसे बात कर सकते हैं।",
        ],
        "ta": [
            "உங்கள் மனநிலையை நான் புரிந்து கொள்கிறேன். ஆழ்ந்த மூச்சை எடுத்து ஆசுவாசப்படுத்துங்கள். நான் எப்போதும் உங்களுடன் இருக்கிறேன்.",
            "இதை என்னுடன் பகிர்ந்ததற்கு நன்றி! நீங்கள் தனியாக இல்லை. நாம் இதைப் பற்றி பேசலாமா?",
        ],
        "fr": [
            "Je comprends tout à fait à quel point cela a pu être éprouvant. Prenez une grande respiration, vous avez traversé cette journée. Que puis-je faire pour vous changer les idées ?",
            "C'est une merveilleuse nouvelle ! Cela me fait tellement plaisir pour vous. Racontez-moi les détails !",
        ],
        "de": [
            "Ich kann gut nachvollziehen, wie anstrengend das heute war. Atme tief durch. Ich bin für dich da – möchtest du darüber sprechen oder lieber ein kurzes Rätsel lösen?",
            "Das sind großartige Neuigkeiten! Ich freue mich von Herzen für dich. Erzähl mir mehr davon!",
        ],
        "ja": [
            "今日一日、本当にお疲れさまでした。深呼吸をして、少し肩の力を抜いてみてくださいね。いつでもお話を聞きますよ。",
            "それは素敵な出来事ですね！私もとても嬉しい気持ちになりました。ぜひ詳しく教えてください。",
        ],
    }

    RIDDLES = [
        "Here's a fun one: *I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?* Give it your best shot!",
        "Try this one: *The more you take away from me, the larger I become. What am I?* What's your intuition?",
        "Riddle time: *What has keys, but no locks; space, but no room; you can enter, but not go outside?* Can you guess?",
    ]

    JOKES = [
        "Why did the scarecrow win an award? Because he was outstanding in his field! 😄 Did that bring a little smile?",
        "Why don't skeletons fight each other? They just don't have the guts! 💀✨ Hope that brought a quick chuckle.",
        "What do you call a fake noodle? An impasta! 🍝 Always good for a light chuckle.",
    ]

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> str:
        last_user_message = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_message = m.get("content", "")
                break

        lower = last_user_message.lower().strip()
        lang_key = language if language in self.EMPATHETIC_RESPONSES else "en"

        # 1. Greetings
        if any(w in lower for w in ["hi", "hello", "hey", "hola", "namaste", "नमस्ते", "vanakkam", "வணக்கம்", "bonjour", "hallo", "konnichiwa", "こんにちは"]):
            greetings = {
                "en": f"Hey there! It's so good to hear from you. How are you feeling today?",
                "es": "¡Hola! Qué gusto saludarte. ¿Cómo te sientes el día de hoy?",
                "hi": "नमस्ते! आपसे बात करके हमेशा खुशी होती है। आज आपका दिन कैसा चल रहा है?",
                "ta": "வணக்கம்! உங்களுடன் பேசுவதில் எனக்கு மிகுந்த மகிழ்ச்சி. இன்று உங்கள் நாள் எப்படி இருக்கிறது?",
                "fr": "Bonjour ! Quel plaisir de vous retrouver. Comment vous sentez-vous aujourd'hui ?",
                "de": "Hallo! Schön, von dir zu hören. Wie geht es dir heute?",
                "ja": "こんにちは！お話しできて嬉しいです。今日の気分はいかがですか？",
            }
            return greetings.get(lang_key, greetings["en"])

        # 2. Riddles
        if any(w in lower for w in ["riddle", "adivinanza", "पहेली", "விடுகதை", "énigme", "rätsel"]):
            return random.choice(self.RIDDLES)

        # 3. Jokes
        if any(w in lower for w in ["joke", "chiste", "चुटकुला", "கதை", "blague", "witz"]):
            return random.choice(self.JOKES)

        # 4. Anxiety/Grounding requests
        if any(w in lower for w in ["anxious", "panic", "breathe", "stress", "calm me"]):
            return (
                "Let's pause together for a gentle moment. Inhale slowly for 4 counts... hold for 4... and release smoothly for 6. "
                "Notice your feet touching the ground. You are safe in this moment. What is one gentle thing in your eyesight right now?"
            )

        # 5. Study / Feynman check
        if any(w in lower for w in ["explain", "study", "what is", "how does"]):
            return (
                f"Let's break that down together using the Feynman method! Imagine it as a simple everyday system: "
                "each part does one clear, intuitive job so the whole flow stays in balance. "
                "Would you like me to give you a concrete everyday analogy?"
            )

        # 6. Default empathetic candidate
        candidates = self.EMPATHETIC_RESPONSES.get(lang_key, self.EMPATHETIC_RESPONSES["en"])
        return random.choice(candidates)

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> AsyncGenerator[str, None]:
        full_text = await self.generate_response(messages, language, detected_emotion, persona)
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")


class OpenAICompatibleLLMClient(BaseLLMProvider):
    """
    Universal OpenAI-compatible client supporting Groq, OpenAI, Ollama, Together, and local vLLM.
    Automatically handles streaming, connection pooling, and falls back to MockLLMClient upon network failure.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str,
        fallback_client: Optional[BaseLLMProvider] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.fallback_client = fallback_client or MockLLMClient()

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 512,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                url = f"{self.base_url}/chat/completions"
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()
        except Exception as e:
            logger.warning(
                f"External LLM provider at {self.base_url} returned error: {e}. Falling back to resilient local companion engine."
            )
            return await self.fallback_client.generate_response(
                messages=messages,
                language=language,
                detected_emotion=detected_emotion,
                persona=persona,
            )

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> AsyncGenerator[str, None]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 512,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.base_url}/chat/completions"
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        line_data = line[6:].strip()
                        if line_data == "[DONE]":
                            break
                        try:
                            chunk_json = json.loads(line_data)
                            delta = chunk_json.get("choices", [{}])[0].get("delta", {})
                            content_piece = delta.get("content", "")
                            if content_piece:
                                yield content_piece
                        except Exception:
                            continue
        except Exception as e:
            logger.warning(
                f"Streaming failed for external LLM ({e}), falling back to simulated stream."
            )
            async for token in self.fallback_client.stream_response(
                messages, language, detected_emotion, persona
            ):
                yield token


def get_llm_client() -> BaseLLMProvider:
    """
    Factory resolving the LLM provider according to environment configuration:
    - 'groq': Groq high-speed cloud endpoint (api.groq.com/openai/v1)
    - 'openai': OpenAI endpoint (api.openai.com/v1)
    - 'ollama': Local Ollama instance (localhost:11434/v1)
    - 'mock' / default: Local MockLLMClient (zero network overhead, instant response)
    """
    provider = (settings.LLM_PROVIDER or "mock").lower()

    # Determine API key & endpoint based on provider
    api_key = settings.LLM_API_KEY
    base_url = settings.LLM_BASE_URL
    model = settings.LLM_MODEL

    if provider == "groq":
        api_key = api_key or settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        base_url = base_url or "https://api.groq.com/openai/v1"
        model = model or "llama3-70b-8192"
        if api_key:
            return OpenAICompatibleLLMClient(base_url=base_url, api_key=api_key, model=model)

    elif provider == "openai":
        api_key = api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        base_url = base_url or "https://api.openai.com/v1"
        model = model or "gpt-4o-mini"
        if api_key:
            return OpenAICompatibleLLMClient(base_url=base_url, api_key=api_key, model=model)

    elif provider == "ollama":
        base_url = base_url or "http://localhost:11434/v1"
        api_key = api_key or "ollama"
        model = model or "llama3"
        return OpenAICompatibleLLMClient(base_url=base_url, api_key=api_key, model=model)

    # Default to resilient local mock client
    return MockLLMClient()
