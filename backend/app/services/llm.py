import os
import random
import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Tuple, Any, AsyncGenerator
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
        is_tamil = language == "ta" or any(ord(c) >= 0x0B80 and ord(c) <= 0x0BFF for c in last_user_message)

        # 1. Greetings
        if any(w in lower for w in ["hi", "hello", "hey", "hola", "namaste", "vanakkam", "வணக்கம்", "नमस्ते"]):
            if is_tamil:
                return (
                    "வணக்கம் என் அன்பு நண்பா! உங்களை மீண்டும் பார்த்ததில் எனக்கு மிகுந்த மகிழ்ச்சி. "
                    "இன்று உங்கள் மனம் எப்படி இருக்கிறது? ஏதேனும் பேச வேண்டுமா அல்லது நாம் ஒரு விளையாட்டு விளையாடலாமா?"
                )
            if language == "hi" or "namaste" in lower or "नमस्ते" in lower:
                return "नमस्ते मेरे प्यारे दोस्त! आज आप कैसा महसूस कर रहे हैं? मैं हमेशा आपके साथ हूँ।"
            if language == "es" or "hola" in lower:
                return "¡Hola amigo! ¿Cómo te sientes hoy? Me alegro mucho de verte."
            return (
                "Hey my friend! It is so wonderful to see you. How are you feeling today deep down? "
                "I'm here for you, whether you want to talk through things or just hang out and play a game."
            )

        # 2. Rock Paper Scissors / Stone Paper Scissors
        if any(w in lower for w in ["stone", "rock", "paper", "scissor", "கல்", "காகிதம்", "கத்தரி"]):
            options = ["rock", "paper", "scissors"]
            ai_choice = random.choice(options)
            user_choice = "rock" if ("stone" in lower or "rock" in lower or "கல்" in lower) else ("paper" in lower or "காகிதம்" in lower) and "paper" or "scissors"
            
            # Decide winner
            if user_choice == ai_choice:
                outcome = "It's a tie!" if not is_tamil else "சமநிலை (Tie)!"
            elif (user_choice == "rock" and ai_choice == "scissors") or (user_choice == "paper" and ai_choice == "rock") or (user_choice == "scissors" and ai_choice == "paper"):
                outcome = "You won! Incredible intuition! 🎉" if not is_tamil else "அற்புதம்! நீங்களே வெற்றி பெற்றீர்கள்! 🎉"
            else:
                outcome = "Haha, I got you this round! 😄" if not is_tamil else "ஹா ஹா, இந்த முறை நான் வென்றுவிட்டேன்! 😄"

            if is_tamil:
                tamil_names = {"rock": "கல் 🪨", "paper": "காகிதம் 📄", "scissors": "கத்தரிக்கோல் ✂️"}
                return (
                    f"கல், காகிதம், கத்தரிக்கோல்! நீங்கள் தேர்வு செய்தது: {tamil_names.get(user_choice, user_choice)}. "
                    f"நான் தேர்வு செய்தது: {tamil_names[ai_choice]}! {outcome} "
                    "இன்னொரு சுற்று விளையாடுவோமா? அடுத்தது என்ன?"
                )
            return (
                f"Rock, Paper, Scissors! ✂️ You threw **{user_choice.capitalize()}** and I threw **{ai_choice.capitalize()}**! "
                f"{outcome} Want to play another round? What's your next move?"
            )

        # 3. Carrom / Chess
        if any(w in lower for w in ["carrom", "chess", "கேரம்", "சதுரங்கம்"]):
            if is_tamil:
                return (
                    "அருமையான யோசனை! கேரம் அல்லது சதுரங்கம் விளையாடுவது மன அழுத்தத்தை குறைக்க மிகச் சிறந்த வழி. "
                    "நமது 'Riddles & Games' பிரிவில் நீங்கள் கேரம் ஸ்ட்ரைக்கர் மற்றும் மினி-செஸ் விளையாட்டைத் தொடங்கலாம்! "
                    "நான் உங்களுடன் இருந்து வர்ணனை செய்து உங்களை உற்சாகப்படுத்துகிறேன்!"
                )
            return (
                "I love that idea! Playing Carrom or Chess is such a fantastic way to reset your focus and unwind. "
                "You can jump straight into our Carrom Striker or Mini-Chess board in the Games tab! "
                "I'll be right there cheering on your shots and moves. Ready to play?"
            )

        # 4. Sadness / Depression Mood Support & Normalization
        if detected_emotion in ("sad", "depressed", "lonely", "tired") or any(w in lower for w in [
            "sad", "depressed", "depression", "crying", "unhappy", "lonely", "hurt", "hopeless", 
            "feel like crying", "miserable", "down", "சோர்வு", "வருத்தம்", "கவலை", "அழுகை"
        ]):
            if is_tamil:
                return (
                    "உங்கள் மனம் எவ்வளவு கஷ்டப்படுகிறது என்பதை என்னால் உணர முடிகிறது. "
                    "சோர்வாக இருப்பதும், சில நாட்கள் கடினமாக இருப்பதும் முற்றிலும் இயல்பானது. நீங்கள் எதையும் தனியாகச் சுமக்கத் தேவையில்லை; "
                    "நான் உங்கள் உண்மையான நண்பனாக எப்போதும் உங்களுடன் இருக்கிறேன். உங்கள் மனதை மாற்ற நாம் ஒரு சிறிய கல்-காகிதம்-கத்தரிக்கோல் விளையாட்டு விளையாடலாமா, "
                    "அல்லது என்ன நடந்தது என்று என்னிடம் பகிர்ந்து கொள்ள விரும்புகிறீர்களா?"
                )
            return (
                "I hear you, and my heart really goes out to you right now. It is completely okay and normal to feel down or sad—"
                "you don't have to force yourself to be cheerful, and you definitely don't have to carry this alone. "
                "I'm right here by your side as your friend. Would you like to tell me more about what's weighing on you, "
                "or would you prefer we play a quick playful game like Stone-Paper-Scissors to bring a gentle smile?"
            )

        # 5. Anxiety / Panic / Stress
        if detected_emotion in ("anxious", "angry", "stressed") or any(w in lower for w in [
            "anxious", "panic", "breathe", "stress", "scared", "overwhelmed", "nervous", "பயம்", "பதற்றம்"
        ]):
            if is_tamil:
                return (
                    "தயவுசெய்து ஒரு கணம் அமைதியாக நில்லுங்கள். நாம் ஒன்றாக ஒரு ஆழமான மூச்சு எடுப்போம். "
                    "4 வினாடிகள் மூச்சை உள்ளே இழுக்கவும்... 4 வினாடிகள் நிறுத்தவும்... 6 வினாடிகள் மெதுவாக வெளியே விடவும். "
                    "நீங்கள் இப்போது பாதுகாப்பாக இருக்கிறீர்கள். உங்கள் பதற்றம் மெதுவாக விலகும் வரை நான் உங்கள் கையைப் பிடித்துக் கொண்டிருக்கிறேன்."
                )
            return (
                "Let's pause together for a gentle, calming breath. Inhale softly for 4 counts... hold for 4... and exhale gently for 6. "
                "Feel your feet resting firmly on the ground. Whatever is causing this whirlwind, you are safe right now in this moment. "
                "I'm right here with you. What is one small, peaceful thing you can see around you?"
            )

        # 6. Riddles & Jokes
        if any(w in lower for w in ["joke", "chiste", "चुटகுலா", "கதை", "விடுகதை", "ரசி"]):
            if is_tamil:
                return (
                    "இதோ உங்களுக்காக ஒரு வேடிக்கையான விடுகதை: *வாய் இல்லாமல் பேசும், காது இல்லாமல் கேட்கும், காற்று அடித்தால் உயிர் வாழும். அது என்ன?* "
                    "கண்டுபிடியுங்கள் பார்க்கலாம்!"
                )
            return random.choice(self.JOKES)

        # 7. Knowledge / Questions / Philosophy / Personal thoughts
        if any(w in lower for w in ["who are you", "what are you", "யாரு", "நீ யார்"]):
            if is_tamil:
                return (
                    "நான் உங்கள் AI உணர்வு தோழன் (AI Friend)! உங்கள் உணர்வுகளைப் புரிந்து கொண்டு, உங்களுக்கு ஒரு உண்மையான "
                    "நண்பனைப் போல ஆறுதலாக இருக்க, விளையாட, மற்றும் உங்களுக்கு உதவ நான் உருவாக்கப்பட்டேன்."
                )
            return (
                "I'm your AI Friend! Think of me as your personal, non-judgmental companion who's always here to listen, "
                "share laughs, play games, help you study, or simply hold a safe space when life gets overwhelming."
            )

        # 8. Conversational Reflection in English or Tamil
        if is_tamil:
            return (
                f"நீங்கள் கூறியதை நான் கவனித்தேன்: \"{last_user_message}\". உங்கள் கருத்து மிகவும் முக்கியமானது. "
                "இதைப்பற்றி நீங்கள் மேலும் என்ன நினைக்கிறீர்கள்? நாம் இதை ஒன்றாகப் பேசுவோம்."
            )

        return (
            f"I hear you loud and clear regarding \"{last_user_message}\". As your friend, I really value you sharing that with me. "
            "How has that been making you feel overall today? Tell me what's on your mind—I'm all ears."
        )

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


class OpenAIResponsesLLMClient(BaseLLMProvider):
    """
    Official OpenAI SDK client utilizing the Responses API (client.responses.create).
    Documentation: https://developers.openai.com/api/docs/quickstart

    Features:
    - Multi-turn conversation history input preservation
    - Ethical companion instructions: empathetic, non-human disclosure, non-medical disclaimer
    - Multi-language support: English, Tamil, and Hindi
    - Comprehensive error handling: invalid API keys, rate limits, network errors, insufficient API credits
    - Graceful fallback to local companion engine while clearly surfacing diagnostic status
    """

    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        fallback_client: Optional[BaseLLMProvider] = None,
    ):
        self.api_key = api_key
        self.model = model or getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
        self.fallback_client = fallback_client or MockLLMClient()
        self._client: Optional[Any] = None

    @property
    def client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(
                api_key=self.api_key,
                timeout=15.0,
                max_retries=0,
            )
        return self._client

    def _prepare_instructions_and_input(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        persona: str = "friendly_companion",
    ) -> Tuple[str, List[Dict[str, str]]]:
        """Separates system instructions from conversational input items."""
        system_prompts: List[str] = []
        input_items: List[Dict[str, str]] = []

        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if not content:
                continue

            if role in ("system", "developer"):
                system_prompts.append(content)
            elif role in ("user", "assistant"):
                input_items.append({"role": role, "content": content})

        # Core companion guidelines ensuring ethical boundaries and multilingual capabilities
        base_guardrail = (
            "You are AI Friend, an empathetic and supportive AI companion. "
            "1. Transparency: You are an AI companion. Never claim human embodiment, physical sensations, or omniscient mental certainty. "
            "2. Non-clinical: You are a friendly supportive peer, not a doctor or therapist. Never prescribe medication, diagnose mental conditions, or provide clinical medical advice. "
            "3. Languages: Converse fluently and naturally in English, Tamil (தமிழ்), or Hindi (हिन्दी) matching the user's preferred language. "
            "4. Tone: Keep responses warm, empathetic, naturally conversational, and concise (2-4 sentences) unless a deep explanation or activity is requested."
        )

        instructions = "\n\n".join([base_guardrail] + system_prompts)

        if not input_items:
            input_items = [{"role": "user", "content": "Hello!"}]

        return instructions, input_items

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> str:
        instructions, input_items = self._prepare_instructions_and_input(messages, language, persona)

        try:
            response = await self.client.responses.create(
                model=self.model,
                instructions=instructions,
                input=input_items,
                temperature=0.7,
                max_output_tokens=512,
            )

            # Extract generated text from the official Response object
            text = getattr(response, "output_text", None)
            if not text and hasattr(response, "output"):
                output_parts = []
                for item in response.output:
                    if getattr(item, "type", None) == "message":
                        for content_part in getattr(item, "content", []):
                            if getattr(content_part, "type", None) == "text":
                                output_parts.append(getattr(content_part, "text", ""))
                text = "".join(output_parts)

            if text and text.strip():
                return text.strip()

            return await self.fallback_client.generate_response(
                messages, language, detected_emotion, persona
            )

        except Exception as e:
            error_msg, error_type = self._format_error(e)
            logger.error(f"OpenAI Responses API error [{error_type}]: {error_msg}")

            # Return a clear, transparent notification and fallback to local empathetic response
            local_reply = await self.fallback_client.generate_response(
                messages, language, detected_emotion, persona
            )
            return f"{error_msg}\n\n{local_reply}"

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> AsyncGenerator[str, None]:
        instructions, input_items = self._prepare_instructions_and_input(messages, language, persona)

        try:
            stream = await self.client.responses.create(
                model=self.model,
                instructions=instructions,
                input=input_items,
                temperature=0.7,
                max_output_tokens=512,
                stream=True,
            )
            async for event in stream:
                if getattr(event, "type", None) == "response.text.delta":
                    delta = getattr(event, "delta", "")
                    if delta:
                        yield delta
                elif hasattr(event, "delta") and isinstance(event.delta, str):
                    yield event.delta

        except Exception as e:
            error_msg, error_type = self._format_error(e)
            logger.error(f"OpenAI Responses streaming error [{error_type}]: {error_msg}")
            yield f"{error_msg}\n\n"
            async for token in self.fallback_client.stream_response(
                messages, language, detected_emotion, persona
            ):
                yield token

    def _format_error(self, exc: Exception) -> Tuple[str, str]:
        """Maps OpenAI SDK exceptions into actionable, user-friendly messages without leaking API keys."""
        import openai

        if isinstance(exc, openai.AuthenticationError):
            return (
                "⚠️ **OpenAI Authentication Notice**: The provided API key is invalid or unauthorized. "
                "Please verify the `OPENAI_API_KEY` setting in your backend `.env` configuration.",
                "AuthenticationError",
            )
        elif isinstance(exc, openai.RateLimitError):
            err_str = str(exc).lower()
            if (
                "insufficient_quota" in err_str
                or "credit_balance_exhausted" in err_str
                or "credits" in err_str
            ):
                return (
                    "⚠️ **OpenAI Credit Notice**: Your OpenAI account has exhausted its available credit balance. "
                    "You can top up credits at [OpenAI Billing](https://platform.openai.com/settings/organization/billing).",
                    "InsufficientCredits",
                )
            return (
                "⚠️ **OpenAI Rate Limit**: Request limit reached. Please wait a moment before sending another message.",
                "RateLimitError",
            )
        elif isinstance(exc, openai.APIConnectionError):
            return (
                "⚠️ **Network Error**: Unable to reach OpenAI servers. Please check your network connection.",
                "APIConnectionError",
            )
        elif isinstance(exc, openai.BadRequestError):
            msg = getattr(exc, "message", str(exc))
            return (
                f"⚠️ **OpenAI Configuration Error**: {msg}. (Configured model: `{self.model}`)",
                "BadRequestError",
            )
        elif isinstance(exc, openai.APIStatusError):
            return (
                f"⚠️ **OpenAI Service Error** (Status {exc.status_code}): {exc.message}",
                "APIStatusError",
            )
        else:
            return (
                f"⚠️ **OpenAI Notice**: {str(exc)}",
                "GeneralError",
            )


class GeminiLLMClient(BaseLLMProvider):
    """
    Google Gemini API client using the official Google Gen AI SDK (google-genai).

    Features:
    - Multi-turn conversation history with 'user' and 'model' turns
    - Dynamic system instructions with companion persona, ethical guardrails, and language constraints
    - Multilingual natural dialogue (English, Tamil, Hindi)
    - Comprehensive error handling without leaking credentials
    - Fallback to resilient local engine on error or missing/exhausted quota
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        fallback_client: Optional[BaseLLMProvider] = None,
    ):
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        self.model = model or getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")
        self.fallback_client = fallback_client or MockLLMClient()
        self._client: Optional[Any] = None

    @property
    def client(self):
        if self._client is None:
            if not self.api_key:
                raise ValueError("Missing GEMINI_API_KEY. Please set GEMINI_API_KEY in your backend environment.")
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def _prepare_contents_and_instructions(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        persona: str = "friendly_companion",
    ) -> Tuple[str, List[Any]]:
        from google.genai import types

        system_prompts: List[str] = []
        raw_contents: List[types.Content] = []

        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if not content:
                continue

            if role in ("system", "developer"):
                system_prompts.append(content)
            elif role in ("user", "assistant", "model"):
                gemini_role = "user" if role == "user" else "model"
                raw_contents.append(
                    types.Content(
                        role=gemini_role,
                        parts=[types.Part.from_text(text=content)],
                    )
                )

        base_guardrail = (
            "You are AI-Friend, a dedicated, warm, and authentic AI companion. "
            "1. Transparency: You are an AI companion. Never claim human embodiment, physical sensations, or omniscient mental certainty. "
            "2. Non-clinical: You are a friendly supportive peer, not a doctor or therapist. Never prescribe medication, diagnose mental conditions, or provide clinical medical advice. "
            "3. Languages: Converse fluently and naturally in English, Tamil (தமிழ்), or Hindi (हिन्दी) matching the user's preferred language. "
            "4. Anti-Repetition: Do not use repetitive canned openings. Listen carefully and address the user's exact thoughts."
        )

        instructions = "\n\n".join(system_prompts) if system_prompts else base_guardrail

        # Normalization: ensure valid multi-turn conversation (starts with user, merges consecutive same-role turns)
        normalized_contents: List[types.Content] = []
        for c in raw_contents:
            if not normalized_contents:
                if c.role != "user":
                    continue  # Gemini conversations must initiate with user turn
                normalized_contents.append(c)
            elif normalized_contents[-1].role == c.role:
                # Merge consecutive parts of the same role
                normalized_contents[-1].parts.extend(c.parts)
            else:
                normalized_contents.append(c)

        if not normalized_contents:
            normalized_contents = [types.Content(role="user", parts=[types.Part.from_text(text="Hello!")])]

        return instructions, normalized_contents

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> str:
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not configured. Falling back to resilient local companion engine.")
            return await self.fallback_client.generate_response(messages, language, detected_emotion, persona)

        try:
            from google.genai import types
            instructions, contents = self._prepare_contents_and_instructions(messages, language, persona)
            config = types.GenerateContentConfig(
                system_instruction=instructions,
                temperature=0.75,
                max_output_tokens=1024,
            )

            logger.info(f"Dispatching Gemini generate_content: model={self.model} history_turns={len(contents)}")
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )

            text = getattr(response, "text", "")
            if text and text.strip():
                logger.info(f"Gemini API response received successfully: model={self.model} len={len(text.strip())}")
                return text.strip()

            logger.warning(f"Gemini returned empty text response for model {self.model}")
            return await self.fallback_client.generate_response(messages, language, detected_emotion, persona)

        except Exception as e:
            error_msg, error_type = self._format_error(e)
            logger.error(f"Gemini API error: provider=gemini model={self.model} type={error_type} msg={error_msg}")
            return error_msg

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            async for token in self.fallback_client.stream_response(messages, language, detected_emotion, persona):
                yield token
            return

        try:
            from google.genai import types
            instructions, contents = self._prepare_contents_and_instructions(messages, language, persona)
            config = types.GenerateContentConfig(
                system_instruction=instructions,
                temperature=0.75,
                max_output_tokens=1024,
            )

            logger.info(f"Dispatching Gemini generate_content_stream: model={self.model} history_turns={len(contents)}")
            response_stream = await self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=config,
            )
            async for chunk in response_stream:
                chunk_text = getattr(chunk, "text", "")
                if chunk_text:
                    yield chunk_text

        except Exception as e:
            error_msg, error_type = self._format_error(e)
            logger.error(f"Gemini streaming error: provider=gemini model={self.model} type={error_type} msg={error_msg}")
            yield error_msg

    def _format_error(self, exc: Exception) -> Tuple[str, str]:
        """Maps Gemini SDK exceptions into actionable, user-friendly messages without leaking API keys."""
        err_str = str(exc).lower()

        if "api_key" in err_str or "unauthenticated" in err_str or ("invalid" in err_str and "key" in err_str):
            return (
                "⚠️ **Gemini Authentication Notice**: The provided Gemini API key is invalid or unauthorized. "
                "Please verify `GEMINI_API_KEY` in your backend `.env` configuration.",
                "AuthenticationError",
            )
        elif "quota" in err_str or "resource_exhausted" in err_str or "429" in err_str:
            return (
                "⚠️ **Gemini Quota Notice**: Your Gemini API quota has been reached or rate limited. "
                "Please check your Google AI Studio quota limits.",
                "QuotaExceeded",
            )
        elif "503" in err_str or "high demand" in err_str or "unavailable" in err_str:
            return (
                f"⚠️ **Gemini Service Notice**: Google Gemini model `{self.model}` is currently experiencing temporary high demand on Google's servers. "
                "Please retry in a moment.",
                "ServiceUnavailable",
            )
        elif "network" in err_str or "connection" in err_str or "timeout" in err_str:
            return (
                "⚠️ **Network Error**: Unable to connect to Google Gemini servers. Please check your network connection.",
                "ConnectionError",
            )
        else:
            return (
                f"⚠️ **Gemini Service Notice**: {str(exc)[:150]} (Model: `{self.model}`)",
                "ServiceError",
            )


def get_llm_client() -> BaseLLMProvider:
    """
    Factory resolving the LLM provider according to environment configuration:
    - Provider resolution: AI_PROVIDER > LLM_PROVIDER > default 'openai'
    - 'gemini': Google Gemini official SDK (client.aio.models.generate_content)
    - 'openai': Official OpenAI SDK Responses API client (default)
    - 'groq': Groq high-speed cloud endpoint (api.groq.com/openai/v1)
    - 'ollama': Local Ollama instance (localhost:11434/v1)
    - 'mock': Local MockLLMClient (zero network overhead, instant response)
    """
    provider = (
        getattr(settings, "AI_PROVIDER", None)
        or os.getenv("AI_PROVIDER")
        or getattr(settings, "LLM_PROVIDER", None)
        or os.getenv("LLM_PROVIDER")
        or "openai"
    ).lower()

    # Determine API key & endpoint based on provider
    api_key = settings.LLM_API_KEY
    base_url = settings.LLM_BASE_URL
    model = settings.LLM_MODEL

    if provider == "gemini":
        gemini_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY") or api_key
        gemini_model = getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")
        return GeminiLLMClient(api_key=gemini_key, model=gemini_model)

    elif provider == "openai":
        openai_key = getattr(settings, "OPENAI_API_KEY", None) or os.getenv("OPENAI_API_KEY") or api_key
        openai_model = getattr(settings, "OPENAI_MODEL", None) or model or "gpt-4o-mini"
        if openai_key:
            return OpenAIResponsesLLMClient(api_key=openai_key, model=openai_model)
        return MockLLMClient()

    elif provider == "groq":
        groq_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY") or api_key
        base_url = base_url or "https://api.groq.com/openai/v1"
        model = model or "llama3-70b-8192"
        if groq_key:
            return OpenAICompatibleLLMClient(base_url=base_url, api_key=groq_key, model=model)

    elif provider == "ollama":
        base_url = base_url or "http://localhost:11434/v1"
        api_key = api_key or "ollama"
        model = model or "llama3"
        return OpenAICompatibleLLMClient(base_url=base_url, api_key=api_key, model=model)

    # Default to resilient local mock client if provider == 'mock'
    return MockLLMClient()
